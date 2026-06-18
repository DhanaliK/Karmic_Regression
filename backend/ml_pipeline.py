import os
from database import SessionLocal
from models import FeedbackLog, MonthlyInsight
from email_service import send_email
import pandas as pd
import numpy as np
import joblib
from sklearn.mixture import BayesianGaussianMixture
from sklearn.preprocessing import RobustScaler

def trigger_retraining():
    print("Initiating background BGMM retraining sequence with new data...")
    db = SessionLocal()
    try:
        # Fetch user data from MonthlyInsights to use as training features
        insights = db.query(MonthlyInsight).all()
        
        # If we don't have enough data to train, abort
        if len(insights) < 10:
            print("Not enough diverse data to retrain BGMM. Need at least 10 valid inputs.")
            return

        features = []
        for insight in insights:
            ans = insight.user_answers
            if not ans or not isinstance(ans, dict):
                continue
            
            # Extract features safely
            try:
                row = [
                    int(ans.get("age", 25)),
                    1 if ans.get("gender", "Male").lower() == "male" else 0,
                    int(ans.get("q1", 0)),
                    int(ans.get("q2", 0)),
                    int(ans.get("q3", 0)),
                    int(ans.get("q4", 0)),
                    int(ans.get("q5", 0)),
                    int(ans.get("q6", 0)),
                    int(ans.get("q7", 0)),
                    int(ans.get("q8", 0)),
                    int(ans.get("q9", 0))
                ]
                features.append(row)
            except Exception:
                continue

        if len(features) < 10:
            return

        X = np.array(features)
        
        # Preprocess
        scaler = RobustScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Train BGMM
        bgmm = BayesianGaussianMixture(
            n_components=5, 
            covariance_type='full', 
            max_iter=500, 
            random_state=42
        )
        bgmm.fit(X_scaled)
        
        # Save models
        model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        os.makedirs(model_dir, exist_ok=True)
        joblib.dump(bgmm, os.path.join(model_dir, 'karmic_gmm_model_v3.pkl'))
        joblib.dump(scaler, os.path.join(model_dir, 'karmic_scaler_v3.pkl'))
        
        print("Retraining complete. New karmic_gmm_model_v3.pkl saved.")
        
        # Notify Admin
        admin_email = os.getenv("SMTP_EMAIL", "yourkarma833@gmail.com") 
        subject = "System Alert: ML Model Retrained Successfully"
        html_body = f"""
        <h2>Admin Notification</h2>
        <p>The BGMM model has been successfully retrained using the latest {len(features)} user entries.</p>
        <p>The new <strong>karmic_gmm_model_v3.pkl</strong> has been hot-swapped into memory.</p>
        """
        send_email(admin_email, subject, html_body)
    except Exception as e:
        print(f"Retraining failed: {e}")
    finally:
        db.close()

def check_retrain_threshold():
    db = SessionLocal()
    try:
        count = db.query(FeedbackLog).count()
        if count > 0 and count % 50 == 0:
            trigger_retraining()
    except Exception as e:
        print(f"Error checking retrain threshold: {e}")
    finally:
        db.close()
