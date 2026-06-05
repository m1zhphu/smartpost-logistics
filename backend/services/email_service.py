import os
import smtplib
from email.message import EmailMessage
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv():
        return False

load_dotenv()

ROOT_DIR = Path(__file__).resolve().parents[2]
LOGO_PATH = ROOT_DIR / "frontend" / "src" / "assets" / "CompanyLogo4.png"
LOGO_CID = "smartpost-logo"


def _build_otp_text(otp: str, expires_minutes: int) -> str:
    return "\n".join([
        "Xin chào,",
        "",
        f"Mã OTP đăng ký tài khoản SmartPost của bạn là: {otp}",
        f"Mã này có hiệu lực trong {expires_minutes} phút.",
        "",
        "Nếu bạn không yêu cầu đăng ký tài khoản, vui lòng bỏ qua email này.",
        "",
        "SmartPost Logistics",
    ])


def _build_otp_html(otp: str, expires_minutes: int) -> str:
    return f"""\
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mã OTP đăng ký tài khoản SmartPost</title>
  </head>
  <body style="margin:0; padding:0; background:#eef2f7; font-family:Arial,Helvetica,sans-serif; color:#152238;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f7; padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 16px 40px rgba(15,23,42,0.12);">
            <tr>
              <td style="background:#0f172a; padding:28px 32px; text-align:center;">
                <img src="cid:{LOGO_CID}" alt="SmartPost Logistics" width="220" style="display:block; margin:0 auto; max-width:220px; height:auto;">
              </td>
            </tr>
            <tr>
              <td style="padding:34px 36px 16px;">
                <p style="margin:0 0 8px; color:#64748b; font-size:14px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">Xác thực tài khoản</p>
                <h1 style="margin:0; color:#0f172a; font-size:26px; line-height:1.25;">Mã OTP đăng ký SmartPost</h1>
                <p style="margin:16px 0 0; color:#475569; font-size:15px; line-height:1.7;">
                  Xin chào, vui lòng sử dụng mã OTP bên dưới để hoàn tất đăng ký tài khoản khách hàng.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 36px 8px;">
                <div style="background:#f8fafc; border:1px solid #dbe4ef; border-radius:16px; padding:24px; text-align:center;">
                  <div style="color:#64748b; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em;">Mã xác thực của bạn</div>
                  <div style="margin-top:12px; font-size:38px; line-height:1; font-weight:800; letter-spacing:0.22em; color:#2563eb; font-family:'Courier New',Courier,monospace;">{otp}</div>
                  <div style="margin-top:16px; color:#334155; font-size:14px;">
                    Mã có hiệu lực trong <strong>{expires_minutes} phút</strong>.
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 36px 34px;">
                <div style="background:#fff7ed; border:1px solid #fed7aa; color:#9a3412; border-radius:12px; padding:14px 16px; font-size:14px; line-height:1.6;">
                  Không chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu đăng ký tài khoản, vui lòng bỏ qua email này.
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 36px; text-align:center;">
                <p style="margin:0; color:#64748b; font-size:13px; line-height:1.6;">
                  Email được gửi tự động từ hệ thống SmartPost Logistics.<br>
                  Vui lòng không trả lời trực tiếp email này.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


def _attach_logo(html_part):
    if not LOGO_PATH.exists():
        return

    with LOGO_PATH.open("rb") as logo_file:
        html_part.add_related(
            logo_file.read(),
            maintype="image",
            subtype="png",
            cid=f"<{LOGO_CID}>",
            filename="smartpost-logo.png",
        )


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
    msg.set_content(_build_otp_text(otp, expires_minutes))
    msg.add_alternative(_build_otp_html(otp, expires_minutes), subtype="html")
    _attach_logo(msg.get_payload()[1])

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
