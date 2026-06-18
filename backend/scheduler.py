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

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run once a day. For demo purposes, we will run it every 60 minutes.
    scheduler.add_job(
        check_monthly_cycles,
        trigger=IntervalTrigger(minutes=60),
        id='monthly_check',
        name='Check for users needing monthly updates',
        replace_existing=True
    )
    scheduler.start()
    print("APScheduler started successfully.")
