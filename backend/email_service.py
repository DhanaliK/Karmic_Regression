import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

SMTP_EMAIL = os.getenv("SMTP_EMAIL", "yourkarma833@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_email(to_email: str, subject: str, html_body: str):
    if not SMTP_PASSWORD:
        print(f"Mock Email to {to_email}: {subject}")
        return True

    msg = MIMEMultipart("alternative")
    msg['Subject'] = subject
    msg['From'] = f"Karmic Evolution <{SMTP_EMAIL}>"
    msg['To'] = to_email

    part = MIMEText(html_body, 'html')
    msg.attach(part)

    try:
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def send_otp_email(to_email: str, otp_code: str, context: str = "register"):
    if context == "register":
        subject = "🔮 Unlock Your Karmic Era"
        heading = "Welcome to the Karmic Portal, Bestie"
        text = "The universe is ready for your character development arc. To lock in and initialize your behavioral tracking, drop this secure verification code:"
    elif context == "resend":
        subject = "🔮 We got you (New Code Dropped)"
        heading = "Lost in the void?"
        text = "No stress, the universe glitch-corrected. Here's your fresh verification code. Don't let it expire this time:"
    elif context == "reset":
        subject = "🔮 Memory Wipe? (Reset Code)"
        heading = "Forgot your password?"
        text = "It happens to the best of us—karmic overload is real. Use this code to hard-reset your access and get back to your evolution:"
    else:
        subject = "🔮 Your Karmic Access Code"
        heading = "Access Code"
        text = "Use this code to proceed:"

    html_body = f"""
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; background: #0f172a; color: white; padding: 40px; border-radius: 20px; border: 1px solid #3b0764;">
        <h2 style="color: #a855f7;">{heading}</h2>
        <p style="font-size: 16px; color: #cbd5e1; line-height: 1.5;">{text}</p>
        <div style="background: rgba(168, 85, 247, 0.1); padding: 20px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #a855f7; text-align: center;">
            <h1 style="font-size: 48px; letter-spacing: 12px; color: #fff; margin: 0;">{otp_code}</h1>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center;">*This code vaporizes in exactly 15 minutes. Move fast.*</p>
    </div>
    """
    return send_email(to_email, subject, html_body)

def send_genz_reminder(to_email: str, username: str, genz_content: str):
    subject = "🔮 Time for your Monthly Karmic Check-in!"
    html_body = f"""
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; background: #0f172a; color: white; padding: 40px; border-radius: 20px; border: 1px solid #3b0764;">
        <h2 style="color: #a855f7;">Hey {username},</h2>
        <div style="background: rgba(168, 85, 247, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #a855f7;">
            {genz_content}
        </div>
        <p>It's been a solid 30 days. Let's see if you've leveled up or if the universe needs to humbly check your ego.</p>
        <a href="http://localhost:5173" style="display: inline-block; background: #9333ea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; margin-top: 20px;">Unlock This Month's Evolution</a>
    </div>
    """
    return send_email(to_email, subject, html_body)
