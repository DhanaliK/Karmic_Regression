from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import string

from database import get_db
from models import User, OTP
from auth import get_password_hash, verify_password, create_access_token
from email_service import send_otp_email
from pydantic import BaseModel
from limiter import limiter

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    dob: str | None = None
    age: int | None = None
    gender: str | None = None
    answers: dict | None = None

class VerifyOTPRequest(BaseModel):
    email: str
    otp_code: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
@limiter.limit("5/minute")
def register_user(request: Request, req: RegisterRequest, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.email == req.email).first()
        if db_user:
            if db_user.is_verified:
                raise HTTPException(status_code=400, detail="Email already registered and verified.")
            else:
                # Re-send OTP for unverified user
                pass
        else:
            # Create new unverified user
            hashed_password = get_password_hash(req.password)
            db_user = User(
                email=req.email,
                username=req.username,
                password_hash=hashed_password,
                dob=req.dob,
                age=req.age,
                gender=req.gender,
                role="user"
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)

        # Generate OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        expire_time = datetime.utcnow() + timedelta(minutes=15)
        
        new_otp = OTP(email=req.email, otp_code=otp_code, purpose="verify", expires_at=expire_time)
        db.add(new_otp)
        db.commit()

        # Save initial answers as PendingPrediction to trigger background processing
        if req.answers and isinstance(req.answers, dict):
            from db import save_pending_prediction
            save_pending_prediction(req.email, 2, req.answers)

        # Send Email
        send_otp_email(req.email, otp_code, context="register")
        return {"message": "Verification code sent to your email."}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error during registration.")

@router.post("/verify-otp")
@limiter.limit("10/minute")
def verify_otp(request: Request, req: VerifyOTPRequest, db: Session = Depends(get_db)):
    db_otp = db.query(OTP).filter(OTP.email == req.email, OTP.otp_code == req.otp_code, OTP.purpose == "verify").order_by(OTP.id.desc()).first()
    
    if not db_otp:
        raise HTTPException(status_code=400, detail="Invalid verification code.")
    
    if datetime.utcnow() > db_otp.expires_at:
        raise HTTPException(status_code=400, detail="Verification code has expired.")

    db_user = db.query(User).filter(User.email == req.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")

    db_user.is_verified = True
    db.commit()

    # Clean up OTP
    db.query(OTP).filter(OTP.email == req.email).delete()
    db.commit()

    return {"message": "Account verified successfully. You can now log in."}

@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, req: LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == req.email).first()
    if not db_user or not verify_password(req.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    if not db_user.is_verified:
        raise HTTPException(status_code=403, detail="Account not verified. Please check your email for the OTP.")

    access_token = create_access_token(data={"sub": db_user.email, "role": db_user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": db_user.email,
            "username": db_user.username,
            "role": db_user.role
        }
    }

class ResendOTPRequest(BaseModel):
    email: str

@router.post("/resend-otp")
@limiter.limit("3/minute")
def resend_otp(request: Request, req: ResendOTPRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == req.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")
    if db_user.is_verified:
        raise HTTPException(status_code=400, detail="User already verified.")
        
    otp_code = ''.join(random.choices(string.digits, k=6))
    expire_time = datetime.utcnow() + timedelta(minutes=15)
    
    new_otp = OTP(email=req.email, otp_code=otp_code, purpose="verify", expires_at=expire_time)
    db.add(new_otp)
    db.commit()

    send_otp_email(req.email, otp_code, context="resend")
    return {"message": "Verification code resent."}

@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, req: ResendOTPRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == req.email).first()
    if not db_user:
        return {"message": "If that email exists, a reset code has been sent."}
        
    otp_code = ''.join(random.choices(string.digits, k=6))
    expire_time = datetime.utcnow() + timedelta(minutes=15)
    
    new_otp = OTP(email=req.email, otp_code=otp_code, purpose="reset", expires_at=expire_time)
    db.add(new_otp)
    db.commit()

    # Reuse send_otp_email for now, just a different context
    send_otp_email(req.email, otp_code, context="reset")
    return {"message": "If that email exists, a reset code has been sent."}

class ResetPasswordRequest(BaseModel):
    email: str
    otp_code: str
    new_password: str

@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, req: ResetPasswordRequest, db: Session = Depends(get_db)):
    db_otp = db.query(OTP).filter(OTP.email == req.email, OTP.otp_code == req.otp_code, OTP.purpose == "reset").order_by(OTP.id.desc()).first()
    
    if not db_otp or datetime.utcnow() > db_otp.expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")
        
    db_user = db.query(User).filter(User.email == req.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    db_user.password_hash = get_password_hash(req.new_password)
    db.commit()
    
    db.query(OTP).filter(OTP.email == req.email, OTP.purpose == "reset").delete()
    db.commit()
    
    return {"message": "Password reset successfully."}
