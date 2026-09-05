from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
from database import SessionLocal
from models import User, MonthlyInsight
from email_service import send_genz_reminder
import json

def check_monthly_cycles():
    print("Running scheduled Monthly Cycle check...")
    db = SessionLocal()
    try:
        # Get all verified users
        users = db.query(User).filter(User.is_verified == True).all()
        for user in users:
            # Get their most recent insight
            latest_insight = db.query(MonthlyInsight).filter(MonthlyInsight.user_id == user.id).order_by(MonthlyInsight.timestamp.desc()).first()
            if latest_insight:
                # Check if it has been 30 days
                time_diff = datetime.utcnow() - latest_insight.timestamp
                if time_diff.days >= 30:
                    # Time for a new cycle! We need to send them a GenZ email reminder.
                    # Generate an ad-hoc genz string or just use a dynamic template.
                    
                    genz_content = f"Bro... the universe has been watching you for a whole month. It's time to see if you actually fixed your karma or if you're still on that same toxic loop. Pull up to the portal and let's decode your current vibe."
                    
                    print(f"Sending monthly reminder to {user.email}")
                    send_genz_reminder(user.email, user.username, genz_content)
                    
                    # Update the timestamp slightly so we don't spam them every minute if they don't log in immediately
                    # We'll just set it forward a day for a buffer, or we could add a `reminder_sent` column.
                    # For simplicity, we just add 1 day to the latest insight so they get reminded tomorrow if they ignore it.
                    latest_insight.timestamp = latest_insight.timestamp + timedelta(days=1)
                    db.commit()
    except Exception as e:
        print(f"Error in scheduler: {e}")
    finally:
        db.close()

def process_pending_predictions():
    from db import get_pending_predictions, update_pending_prediction_status, save_monthly_insight
    from llm_service import generate_stage_1_reflection, generate_stage_2_reflection
    from symbolic_engine import generate_symbolic_priors
    from email_service import send_email

    print("Running scheduled Pending Predictions check...")
    pending_list = get_pending_predictions()
    for pending in pending_list:
        try:
            subject = "Your Karmic Reflection is Ready"
            html_body = """
            <h3>Your Karmic Reflection is Ready!</h3>
            <p>Our psychological engine has successfully analyzed your behaviors and the deep reflection is now available in your portal.</p>
            <p>Log in to <b>Karmic Regression</b> to discover your active karmic loops and archetypal insights.</p>
            """
            message_id = f"<karmic-prediction-{pending.id}@karmic-regression>"

            # An email_pending row already has its insight. Retry only SMTP so
            # transient mail failures cannot regenerate or duplicate insights.
            if pending.status == "email_pending":
                if send_email(pending.email, subject, html_body, message_id=message_id):
                    update_pending_prediction_status(pending.id, "completed")
                    print(f"Delivered queued resolution email for {pending.email}")
                else:
                    print(f"Resolution email still unavailable for pending prediction {pending.id}")
                continue

            payload = json.loads(pending.payload)
            priors = generate_symbolic_priors(payload.get("name"), payload.get("dob"), payload.get("age"), payload.get("gender"))
            if "ml_features" in priors:
                priors.pop("ml_features")

            ARCHETYPES = ["Fire Karma", "Shadow Karma", "Healing Karma", "Power Karma", "Wandering Karma", "Mirror Karma"]
            sorted_probs = {arch: round(1.0 / len(ARCHETYPES), 2) for arch in ARCHETYPES}

            if pending.stage == 1:
                reflection = generate_stage_1_reflection(payload.get("name"), payload.get("dob"), payload.get("age"), payload.get("gender"), sorted_probs, priors)
            else:
                reflection = generate_stage_2_reflection(payload.get("name"), payload.get("dob"), payload.get("age"), payload.get("gender"), sorted_probs, payload, priors)

            if not save_monthly_insight(pending.email, None, payload, reflection):
                raise RuntimeError("Could not save generated reflection")

            # Commit durable outbox state before SMTP. A restart after this
            # point retries the same message instead of regenerating insight.
            update_pending_prediction_status(pending.id, "email_pending")
            if send_email(pending.email, subject, html_body, message_id=message_id):
                update_pending_prediction_status(pending.id, "completed")
                print(f"Successfully processed and emailed pending prediction for {pending.email}")
            else:
                print(f"Reflection saved; resolution email will retry for {pending.email}")

        except Exception as e:
            print(f"Failed to process pending prediction {pending.id}: {e}")
            # Pending rows remain retryable.

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run once a day. For demo purposes, we will run it every 60 minutes.
    scheduler.add_job(
        check_monthly_cycles,
        trigger=IntervalTrigger(minutes=60),
        id="monthly_check",
        name="Check for users needing monthly updates",
        replace_existing=True
    )
    # Check for pending LLM predictions every 5 minutes
    scheduler.add_job(
        process_pending_predictions,
        trigger=IntervalTrigger(minutes=5),
        id="pending_predictions",
        name="Process pending API predictions",
        replace_existing=True
    )
    scheduler.start()
    print("APScheduler started successfully.")
