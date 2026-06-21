from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    dob = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    
    role = Column(String, default="user") # 'admin' or 'user'
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    monthly_insights = relationship("MonthlyInsight", back_populates="user")
    feedback_logs = relationship("FeedbackLog", back_populates="user")


class OTP(Base):
    __tablename__ = "otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    otp_code = Column(String, nullable=False)
    purpose = Column(String, default="verify") # verify or reset
    expires_at = Column(DateTime, nullable=False)


class MonthlyInsight(Base):
    __tablename__ = "monthly_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    adaptive_questions = Column(Text, nullable=True) # JSON string
    user_answers = Column(Text, nullable=True) # JSON string
    generated_reflection = Column(Text, nullable=True)
    
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="monthly_insights")


class FeedbackLog(Base):
    __tablename__ = "feedback_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    stage = Column(Integer, nullable=True)
    archetype = Column(String, nullable=True)
    llm_output = Column(Text, nullable=True)
    user_rating = Column(Integer, nullable=False)
    
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="feedback_logs")

class PendingPrediction(Base):
    __tablename__ = "pending_predictions"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    stage = Column(Integer, nullable=False) # 1 or 2
    payload = Column(Text, nullable=False) # JSON payload of answers
    status = Column(String, default="pending") # pending, completed, failed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
