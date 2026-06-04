import os
import smtplib
from email.message import EmailMessage
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv():
        return False

load_dotenv()


def send_otp_email(to_email: str, otp: str, expires_minutes: int) -> bool:
    smtp_host = os.getenv("SMTP_HOST") or os.getenv("MAIL_SERVER") or "smtp.gmail.com"
    smtp_port = int(os.getenv("SMTP_PORT") or os.getenv("MAIL_PORT") or "587")
    smtp_username = os.getenv("SMTP_USERNAME") or os.getenv("MAIL_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD") or os.getenv("MAIL_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM_EMAIL") or os.getenv("MAIL_FROM") or smtp_username
    smtp_from_name = os.getenv("SMTP_FROM_NAME") or os.getenv("MAIL_FROM_NAME") or "SmartPost Logistics"
    use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    if not smtp_host or not smtp_from:
        print(f"[SMTP] Missing SMTP config. OTP for {to_email}: {otp}")
        return False

    msg = EmailMessage()
    msg["Subject"] = "Mã OTP đăng ký tài khoản SmartPost"
    msg["From"] = f"{smtp_from_name} <{smtp_from}>"
    msg["To"] = to_email
    msg.set_content(
        "\n".join([
            "Xin chào,",
            "",
            f"Mã OTP đăng ký tài khoản SmartPost của bạn là: {otp}",
            f"Mã này có hiệu lực trong {expires_minutes} phút.",
            "",
            "Nếu bạn không yêu cầu đăng ký tài khoản, vui lòng bỏ qua email này.",
            "",
            "SmartPost Logistics",
        ])
    )

    if use_ssl:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15) as server:
            if smtp_username and smtp_password:
                server.login(smtp_username, smtp_password)
            server.send_message(msg)
    else:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            if use_tls:
                server.starttls()
            if smtp_username and smtp_password:
                server.login(smtp_username, smtp_password)
            server.send_message(msg)

    return True
