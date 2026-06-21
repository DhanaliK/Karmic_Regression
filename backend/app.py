import fastapi
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter
from pydantic import BaseModel
from typing import Optional
import joblib
import os
import xgboost as xgb
import pandas as pd
import numpy as np

import warnings
from sklearn.exceptions import InconsistentVersionWarning

warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

from db import save_feedback, subscribe_user, get_subscription, get_user_history, save_monthly_insight
from llm_service import generate_stage_1_reflection, generate_stage_2_reflection, generate_adaptive_questions
from symbolic_engine import generate_symbolic_priors
import asyncio

import auth_routes
from scheduler import start_scheduler

app = FastAPI(title="Karmic Regression API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth_routes.router)

# Setup CORS strictly via env variables
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Gzip compression for payload optimization
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Karmic Regression Analysis Engine is running.",
        "docs": "/docs"
    }

async def background_retrain_task():
    while True:
        # Sleep for 24 hours (86400 seconds)
        await asyncio.sleep(86400)
        try:
            print("Running scheduled community data sync and model retraining...")
            from ml_pipeline import trigger_retraining
            # Run the synchronous retraining block in a separate thread so it doesn't block FastAPI
            await asyncio.to_thread(trigger_retraining)
            print("Retraining completed successfully. New models are loaded in memory.")
        except Exception as e:
            print(f"Scheduled retraining error: {e}")

@app.on_event("startup")
async def startup_event():
    start_scheduler()
    asyncio.create_task(background_retrain_task())

# Load ML Models
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'saved_models')
gmm_model = None
gmm_scaler = None

try:
    gmm_model = joblib.load(os.path.join(os.path.dirname(__file__), '..', 'models', 'karmic_gmm_model_v3.pkl'))
    gmm_scaler = joblib.load(os.path.join(os.path.dirname(__file__), '..', 'models', 'karmic_scaler_v3.pkl'))
    print("SUCCESS: Loaded V3 BGMM Models.")
except Exception as e:
    print(f"Warning: Could not load V3 BGMM models. {e}")

ARCHETYPES = ["Fire Karma", "Shadow Karma", "Healing Karma", "Power Karma", "Wandering Karma", "Mirror Karma"]

class Stage1Request(BaseModel):
    name: Optional[str] = ""
    dob: Optional[str] = ""
    age: int
    gender: Optional[str] = "Unknown"

class Stage2Request(BaseModel):
    name: Optional[str] = "Seeker"
    dob: str
    age: int
    gender: str
    q1: str
    q2: str
    q3: str
    q4: str
    q5: str
    q6: str
    q7: str
    q8: str
    q9: str
    # 'priors' is removed as it's now calculated internally

class FeedbackRequest(BaseModel):
    stage: int
    archetype: str
    probabilities: dict
    symbolic_priors: dict
    llm_output: str
    user_rating: int
    q_responses: Optional[dict] = None

class SubscribeRequest(BaseModel):
    email: str
    name: str
    dob: str
    age: int
    gender: str

class MonthlyQuestionsRequest(BaseModel):
    email: str

class MonthlyReflectionRequest(BaseModel):
    email: str
    name: str
    dob: str
    age: int
    gender: str
    answers: dict

@app.post("/predict/stage1", status_code=200)
@limiter.limit("10/minute")
async def predict_stage1(request: Request, req: Stage1Request, response: fastapi.Response):
    try:
        priors = generate_symbolic_priors(req.name, req.dob, req.age, req.gender)
        ml_features = priors.pop('ml_features')
        
        # For Stage 1 (Before survey), we can just assign equal probabilities
        # or fall back to an astrological heuristic.
        sorted_probs = {arch: round(1.0 / len(ARCHETYPES), 2) for arch in ARCHETYPES}
        primary_archetype = "Unknown"

        try:
            # Now LLM generates the narrative using the predicted probabilities!
            reflection = generate_stage_1_reflection(req.name, req.dob, req.age, req.gender, sorted_probs, priors)
        except Exception as llm_error:
            # If the API fails, return a 202 Accepted with pending flag
            print(f"LLM API Error: {llm_error}")
            response.status_code = 202
            return {
                "status": "pending",
                "message": "Our psychological reflection engine is currently processing high volume. Please proceed to registration; we will securely store your responses and email your complete Karmic Reflection as soon as the system stabilizes.",
                "archetype": primary_archetype,
                "probabilities": sorted_probs,
                "priors": priors,
                "payload": req.model_dump()
            }
        
        return {
            "status": "success",
            "archetype": primary_archetype,
            "probabilities": sorted_probs,
            "priors": priors,
            "reflection": reflection
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/stage2", status_code=200)
@limiter.limit("10/minute")
async def predict_stage2(request: Request, req: Stage2Request, response: fastapi.Response):
    try:
        # Stage 2: Calculate 6 behavioral features from survey responses (Heuristic Map)
        imp = 5 if req.q1 in ['react immediately'] or req.q3 in ['act emotionally'] else 3
        ego = 5 if req.q4 == 'inner ambition' or req.q5 == 'lack of recognition' else 3
        awa = 5 if req.q8 == 'Reflect and improve' or req.q9 == 'Reflection / journaling' else 2
        emp = 4 if req.q3 == 'depend on others' or req.q1 == 'seek reassurance' else 3
        ana = 5 if req.q3 == 'analyze carefully' else 2
        ada = 5 if req.q8 == 'Reflect and improve' else (2 if req.q8 == 'Repeat similar behavior' else 3)
        
        feature_vector = np.array([[imp, ego, awa, emp, ana, ada]])
        
        entropy = 0.0
        is_hybrid = False
        
        if gmm_model and gmm_scaler:
            X_scaled = gmm_scaler.transform(feature_vector)
            probs = gmm_model.predict_proba(X_scaled)[0]
            
            entropy = float(-np.sum(probs * np.log(probs + 1e-12)))
            is_hybrid = bool(entropy >= 0.2)
            
            probs_map = {}
            for i, p in enumerate(probs):
                if i < len(ARCHETYPES):
                    probs_map[ARCHETYPES[i]] = float(p)
        else:
            probs_map = {arch: 1.0/len(ARCHETYPES) for arch in ARCHETYPES}
            
        sorted_probs = dict(sorted(probs_map.items(), key=lambda item: item[1], reverse=True))
        primary_archetype = list(sorted_probs.keys())[0] if sorted_probs else "Unknown"

        # Generate demographic symbolic priors locally since we merged the flow
        priors = generate_symbolic_priors(req.name, req.dob, req.age, req.gender)
        
        # Remove ML features from priors if they exist so they aren't sent to frontend unnecessarily
        if 'ml_features' in priors:
            priors.pop('ml_features')
        
        try:
            # Generate the LLM reflection
            reflection = generate_stage_2_reflection(
                req.name, req.dob, req.age, req.gender,
                sorted_probs, req.model_dump(), priors
            )
        except Exception as llm_error:
            print(f"LLM API Error: {llm_error}")
            response.status_code = 202
            return {
                "status": "pending",
                "message": "Our psychological reflection engine is currently processing high volume. Please proceed to registration; we will securely store your responses and email your complete Karmic Reflection as soon as the system stabilizes.",
                "archetype": primary_archetype,
                "probabilities": sorted_probs,
                "priors": priors,
                "is_hybrid": is_hybrid,
                "entropy": entropy,
                "payload": req.model_dump()
            }

        return {
            "status": "success",
            "archetype": primary_archetype,
            "probabilities": sorted_probs,
            "priors": priors,
            "is_hybrid": is_hybrid,
            "entropy": entropy,
            "reflection": reflection
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/subscribe")
@limiter.limit("5/minute")
async def subscribe(request: Request, req: SubscribeRequest):
    try:
        success = subscribe_user(req.email, req.name, req.dob, req.age, req.gender)
        if success:
            return {"status": "success", "message": "Successfully subscribed to Weekly Karma Forecasts!"}
        else:
            raise HTTPException(status_code=500, detail="Database insertion error.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard/history/{email}")
@limiter.limit("20/minute")
async def get_dashboard_history(request: Request, email: str):
    try:
        sub = get_subscription(email)
        if not sub:
            raise HTTPException(status_code=404, detail="User profile not found. Please register first.")
        history = get_user_history(email)
        return {
            "user": sub,
            "history": history
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/monthly/questions")
@limiter.limit("10/minute")
async def generate_monthly_questions(request: Request, req: MonthlyQuestionsRequest):
    try:
        sub = get_subscription(req.email)
        if not sub:
            raise HTTPException(status_code=404, detail="Subscription profile not found. Please sign in or subscribe first.")
        
        history = get_user_history(req.email)
        if history and len(history) > 0 and history[0]['user_answers']:
            from datetime import datetime
            last_timestamp = history[0]['timestamp']
            
            # If timestamp is a string, parse it. In SQLAlchemy it might be datetime object.
            if isinstance(last_timestamp, str):
                last_time = datetime.fromisoformat(last_timestamp)
            else:
                last_time = last_timestamp
                
            days_passed = (datetime.utcnow() - last_time).days
            
            # Check if 30 days passed (using 30 instead of -1 for prod)
            if days_passed >= 30:
                prev_answers = history[0]['user_answers']
                
                # Generate astrological/numerological priors
                from symbolic_engine import generate_symbolic_priors
                priors = generate_symbolic_priors(sub['name'], sub['dob'], sub['age'], sub['gender'])
                
                questions = generate_adaptive_questions(sub['name'], prev_answers, priors)
                is_adaptive = True
            else:
                questions = []
                is_adaptive = False
        else:
            # First time user, send static baseline questions or tell frontend to use standard 9 questions
            questions = []
            is_adaptive = False
            
        return {
            "is_adaptive": is_adaptive,
            "questions": questions
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/monthly/reflection")
@limiter.limit("10/minute")
async def predict_monthly_reflection(request: Request, req: MonthlyReflectionRequest):
    try:
        sub = get_subscription(req.email)
        if not sub:
            raise HTTPException(status_code=404, detail="Subscription profile not found. Please sign in or subscribe first.")
            
        priors = generate_symbolic_priors(req.name, req.dob, req.age, req.gender)
        
        # Calculate heuristic features from adaptive answers if possible, else default
        # (This is simplified for adaptive answers, we default to 3 unless mapped)
        feature_vector = np.array([[3, 3, 3, 3, 3, 3]]) 
        
        entropy = 0.0
        is_hybrid = False
        
        if gmm_model and gmm_scaler:
            X_scaled = gmm_scaler.transform(feature_vector)
            probs = gmm_model.predict_proba(X_scaled)[0]
            entropy = float(-np.sum(probs * np.log(probs + 1e-12)))
            is_hybrid = bool(entropy >= 0.2)
            probs_map = {ARCHETYPES[i]: float(p) for i, p in enumerate(probs) if i < len(ARCHETYPES)}
        else:
            probs_map = {arch: 1.0/len(ARCHETYPES) for arch in ARCHETYPES}
            
        sorted_probs = dict(sorted(probs_map.items(), key=lambda item: item[1], reverse=True))
        
        # Generate the deep reflection using LLM, passing the custom answers
        reflection = generate_stage_2_reflection(
            req.name, req.dob, req.age, req.gender, sorted_probs, req.answers, priors, is_hybrid
        )
        
        # Save insight to db
        # Since we generated the questions in a previous step, we don't have them in this req payload, 
        # but storing the answers and reflection is sufficient.
        save_monthly_insight(req.email, None, req.answers, reflection)
        
        return {
            "priors": priors,
            "reflection": reflection,
            "probabilities": sorted_probs,
            "is_hybrid": is_hybrid
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def submit_feedback(req: FeedbackRequest):
    try:
        save_feedback(
            req.stage, 
            req.archetype, 
            req.probabilities, 
            req.symbolic_priors, 
            req.llm_output, 
            req.user_rating,
            req.q_responses
        )
        return {"status": "success", "message": "Feedback saved for research analysis"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/stats")
async def get_admin_stats(email: str):
    from database import SessionLocal
    from models import User, FeedbackLog, MonthlyInsight
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or user.role != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized.")
            
        total_users = db.query(User).count()
        total_feedbacks = db.query(FeedbackLog).count()
        total_insights = db.query(MonthlyInsight).count()
        
        # Latest 5 feedbacks
        recent_feedbacks = db.query(FeedbackLog).order_by(FeedbackLog.id.desc()).limit(5).all()
        
        feedbacks = [{
            "id": f.id,
            "user_id": f.user_id,
            "rating": f.user_rating,
            "timestamp": f.timestamp
        } for f in recent_feedbacks]
        
        return {
            "total_users": total_users,
            "total_feedbacks": total_feedbacks,
            "total_insights": total_insights,
            "recent_feedbacks": feedbacks
        }
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*50)
    print("KARMIC REGRESSION API STARTING")
    print("Access locally at: http://127.0.0.1:8000")
    print("Documentation: http://127.0.0.1:8000/docs")
    print("="*50 + "\n")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
