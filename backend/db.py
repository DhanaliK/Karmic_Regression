import json
from database import SessionLocal
from models import User, MonthlyInsight, FeedbackLog

def init_db():
    # Deprecated. SQLAlchemy Base.metadata.create_all handles this in models/database setup.
    pass

def save_feedback(stage, archetype, probabilities, symbolic_priors, llm_output, user_rating, q_responses=None):
    db = SessionLocal()
    try:
        new_feedback = FeedbackLog(
            stage=stage,
            archetype=archetype,
            llm_output=llm_output,
            user_rating=user_rating
            # probabilities, symbolic_priors, q_responses are not currently defined in FeedbackLog model, 
            # we can store them in a JSON field if added to the model, but for now we skip them or update models.py
        )
        db.add(new_feedback)
        db.commit()
        
        # Check if we need to retrain
        from ml_pipeline import check_retrain_threshold
        check_retrain_threshold()
        
    except Exception as e:
        print(f"Database error in save_feedback: {e}")
    finally:
        db.close()

def subscribe_user(email, name, dob, age, gender):
    # Handled by /auth/register now, but if called by old code:
    pass

def get_subscription(email):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            return {
                "name": user.username,
                "dob": user.dob,
                "age": user.age,
                "gender": user.gender,
                "created_at": user.created_at
            }
        return None
    finally:
        db.close()

def save_monthly_insight(email, adaptive_questions, user_answers, generated_reflection):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            insight = MonthlyInsight(
                user_id=user.id,
                adaptive_questions=json.dumps(adaptive_questions) if adaptive_questions else None,
                user_answers=json.dumps(user_answers) if user_answers else None,
                generated_reflection=generated_reflection
            )
            db.add(insight)
            db.commit()
            return True
        return False
    except Exception as e:
        print(f"Database error in save_monthly_insight: {e}")
        return False
    finally:
        db.close()

def get_user_history(email):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return []
        
        insights = db.query(MonthlyInsight).filter(MonthlyInsight.user_id == user.id).order_by(MonthlyInsight.timestamp.desc()).all()
        history = []
        for ins in insights:
            history.append({
                "adaptive_questions": json.loads(ins.adaptive_questions) if ins.adaptive_questions else None,
                "user_answers": json.loads(ins.user_answers) if ins.user_answers else None,
                "generated_reflection": ins.generated_reflection,
                "timestamp": ins.timestamp
            })
        return history
    finally:
        db.close()
