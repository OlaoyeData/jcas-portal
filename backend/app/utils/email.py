"""
Email sending utilities.

Wire up your own SMTP provider by filling in settings.SMTP_* values
and setting EMAILS_ENABLED=True in .env.
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from app.core.config import settings

def _render(template_str: str, context: dict) -> str:
    """Replace {placeholder} tokens with values from context."""
    result = template_str
    for key, value in context.items():
        result = result.replace(f'{{{key}}}', str(value) if value is not None else '')
    return result


def _get_template(db, key: str):
    """Load template from DB. Returns (subject, body) or (None, None) if not found."""
    try:
        from app.models.email_template import EmailTemplate
        tmpl = db.query(EmailTemplate).filter(EmailTemplate.key == key).first()
        if tmpl:
            return tmpl.subject, tmpl.body
    except Exception:
        pass
    return None, None


def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: Optional[str] = None,
) -> bool:
    """Send an email. Returns True on success, False on failure."""
    if not settings.EMAILS_ENABLED:
        print(f"[EMAIL STUB] To: {to_email} | Subject: {subject}")
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    msg["To"]      = to_email

    if text_body:
        msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, to_email, msg.as_string())
        return True
    except Exception as exc:
        print(f"[EMAIL ERROR] {exc}")
        return False


# ── Pre-built email helpers ──────────────────────────────────────────────

def send_verification_email(name: str, email: str, token: str, db=None):
    verify_url    = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    subject_tmpl = "JCAS — Confirm Your Email Address"
    body_tmpl    = (
        "Dear {author_name},\n\n"
        "Thanks for registering with JCAS. Please confirm your email address by clicking the link below "
        "(valid for 48 hours):\n\n{verify_url}\n\n"
        "If you did not create this account, you can safely ignore this email.\n\n"
        "Best regards,\nThe JCAS Editorial Team"
    )
    if db:
        s, b = _get_template(db, "email_verification")
        if s: subject_tmpl = s
        if b: body_tmpl    = b
    ctx = {"author_name": name, "verify_url": verify_url, "frontend_url": settings.FRONTEND_URL}
    send_email(email, _render(subject_tmpl, ctx), _render(body_tmpl, ctx))


def notify_admins_of_verification(admin_emails: list, user_name: str, user_email: str,
                                   confirmed: bool, db=None):
    """Let the editorial office know whether a newly registered author confirmed their email."""
    status_word = "confirmed" if confirmed else "has NOT confirmed"
    subject_tmpl = "JCAS — Author Email {status}: {user_name}"
    body_tmpl = (
        "Hello,\n\n"
        "The author {user_name} ({user_email}) {status_word} their email address.\n\n"
        "Best regards,\nThe JCAS System"
    )
    if db:
        s, b = _get_template(db, "admin_verification_notice")
        if s: subject_tmpl = s
        if b: body_tmpl    = b
    ctx = {
        "status": "Confirmed" if confirmed else "Not Confirmed",
        "status_word": status_word,
        "user_name": user_name,
        "user_email": user_email,
        "frontend_url": settings.FRONTEND_URL,
    }
    for admin_email in admin_emails:
        send_email(admin_email, _render(subject_tmpl, ctx), _render(body_tmpl, ctx))
        

def send_welcome_email(name: str, email: str, db=None):
    subject_tmpl = "Welcome to JCAS — Your Account is Ready"
    body_tmpl    = "Dear {author_name},\n\nWelcome to JCAS. You can now log in and start submitting.\n\nBest regards,\nThe JCAS Editorial Team"
    if db:
        s, b = _get_template(db, "welcome")
        if s: subject_tmpl = s
        if b: body_tmpl    = b
    ctx = {"author_name": name, "frontend_url": settings.FRONTEND_URL}
    send_email(email, _render(subject_tmpl, ctx), _render(body_tmpl, ctx))


def send_password_reset_email(email: str, token: str, name: str = "", db=None):
    reset_url    = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    subject_tmpl = "JCAS — Password Reset Request"
    body_tmpl    = "Dear {author_name},\n\nReset your password here: {reset_url}\n\nBest regards,\nThe JCAS Editorial Team"
    if db:
        s, b = _get_template(db, "password_reset")
        if s: subject_tmpl = s
        if b: body_tmpl    = b
    ctx = {"author_name": name or email, "reset_url": reset_url, "frontend_url": settings.FRONTEND_URL}
    send_email(email, _render(subject_tmpl, ctx), _render(body_tmpl, ctx))


def send_submission_confirmation(email: str, name: str, manuscript_id: str, title: str, db=None):
    subject_tmpl = "JCAS — Manuscript Received: {manuscript_id}"
    body_tmpl    = "Dear {author_name},\n\nYour manuscript \"{manuscript_title}\" (ID: {manuscript_id}) has been received.\n\nBest regards,\nThe JCAS Editorial Team"
    if db:
        s, b = _get_template(db, "submission_confirmation")
        if s: subject_tmpl = s
        if b: body_tmpl    = b
    ctx = {"author_name": name, "manuscript_id": manuscript_id,
           "manuscript_title": title, "frontend_url": settings.FRONTEND_URL}
    send_email(email, _render(subject_tmpl, ctx), _render(body_tmpl, ctx))



def send_review_invitation_email(reviewer_email: str, reviewer_name: str,
                                  manuscript_title: str, deadline: str, accept_url: str, db=None):
    subject_tmpl = "JCAS — Invitation to Review a Manuscript"
    body_tmpl    = "Dear {reviewer_name},\n\nYou are invited to review \"{manuscript_title}\". Deadline: {deadline}.\n\nBest regards,\nThe JCAS Editorial Team"
    if db:
        s, b = _get_template(db, "review_invitation")
        if s: subject_tmpl = s
        if b: body_tmpl    = b
    ctx = {"reviewer_name": reviewer_name, "manuscript_title": manuscript_title,
           "deadline": deadline, "frontend_url": settings.FRONTEND_URL}
    send_email(reviewer_email, _render(subject_tmpl, ctx), _render(body_tmpl, ctx))


def send_decision_email(author_email: str, author_name: str, manuscript_id: str,
                         decision: str, note: str = "", db=None):
    subject_tmpl = "JCAS — Editorial Decision for {manuscript_id}"
    body_tmpl    = "Dear {author_name},\n\nA decision has been made on your manuscript (ID: {manuscript_id}).\n\nDecision: {decision}\n\nBest regards,\nThe JCAS Editorial Team"
    if db:
        s, b = _get_template(db, "decision_notification")
        if s: subject_tmpl = s
        if b: body_tmpl    = b
    ctx = {"author_name": author_name, "manuscript_id": manuscript_id,
           "decision": decision, "frontend_url": settings.FRONTEND_URL}
    send_email(author_email, _render(subject_tmpl, ctx), _render(body_tmpl, ctx))

def send_screening_declined_email(author_email: str, author_name: str,
                                   manuscript_id: str, title: str,
                                   reason: str = "", db=None):
    subject_tmpl = "JCAS — Submission Decision: {manuscript_id}"
    body_tmpl = (
        "Dear {author_name},\n\n"
        "Thank you for submitting your manuscript \"{manuscript_title}\" (ID: {manuscript_id}) to JCAS.\n\n"
        "After initial editorial screening, we regret to inform you that your submission does not meet "
        "our current scope or formatting requirements and will not proceed to peer review at this time.\n\n"
        "Reason: {reason}\n\n"
        "We encourage you to consider revising your manuscript and submitting to a more suitable venue.\n\n"
        "Best regards,\nThe JCAS Editorial Office"
    )
    if db:
        s, b = _get_template(db, "screening_declined")
        if s: subject_tmpl = s
        if b: body_tmpl    = b
    ctx = {"author_name": author_name, "manuscript_id": manuscript_id,
           "manuscript_title": title, "reason": reason or "Does not meet submission requirements.",
           "frontend_url": settings.FRONTEND_URL}
    send_email(author_email, _render(subject_tmpl, ctx), _render(body_tmpl, ctx))


def send_reviewer_assigned_email(reviewer_email: str, reviewer_name: str,
                                  manuscript_title: str, manuscript_id: str,
                                  deadline: str, dashboard_url: str, db=None):
    subject_tmpl = "JCAS — You Have Been Assigned to Review a Manuscript"
    body_tmpl = (
        "Dear {reviewer_name},\n\n"
        "You have been assigned to review the manuscript titled \"{manuscript_title}\" "
        "(ID: {manuscript_id}).\n\n"
        "Please log in to your reviewer dashboard to accept or decline this assignment.\n"
        "Review Deadline: {deadline}\n\n"
        "Dashboard: {dashboard_url}\n\n"
        "Best regards,\nThe JCAS Editorial Team"
    )
    if db:
        s, b = _get_template(db, "reviewer_assigned")
        if s: subject_tmpl = s
        if b: body_tmpl    = b
    ctx = {"reviewer_name": reviewer_name, "manuscript_title": manuscript_title,
           "manuscript_id": manuscript_id, "deadline": deadline,
           "dashboard_url": dashboard_url, "frontend_url": settings.FRONTEND_URL}
    send_email(reviewer_email, _render(subject_tmpl, ctx), _render(body_tmpl, ctx))


def send_revision_reminder_email(author_email: str, author_name: str,
                                  manuscript_id: str, title: str,
                                  deadline: str = "as soon as possible", db=None):
    subject_tmpl = "JCAS — Revision Reminder: {manuscript_id}"
    body_tmpl = (
        "Dear {author_name},\n\n"
        "This is a friendly reminder that your revised manuscript \"{manuscript_title}\" is due on {deadline}.\n\n"
        "Please log in to your author dashboard to upload your revised manuscript:\n"
        "{frontend_url}/dashboard/author\n\n"
        "If you require an extension, please contact the editorial office as soon as possible.\n\n"
        "Best regards,\nThe JCAS Editorial Team"
    )
    if db:
        s, b = _get_template(db, "revision_reminder")
        if s: subject_tmpl = s
        if b: body_tmpl    = b
    ctx = {"author_name": author_name, "manuscript_id": manuscript_id,
           "manuscript_title": title, "deadline": deadline, "frontend_url": settings.FRONTEND_URL}
    send_email(author_email, _render(subject_tmpl, ctx), _render(body_tmpl, ctx))


def send_payment_confirmed_email(author_email: str, author_name: str,
                                  manuscript_id: str, title: str, db=None):
    subject_tmpl = "JCAS — APC Payment Confirmed: {manuscript_id}"
    body_tmpl = (
        "Dear {author_name},\n\n"
        "We are pleased to confirm that your Article Processing Charge (APC) for the manuscript "
        "\"{manuscript_title}\" (ID: {manuscript_id}) has been received and verified.\n\n"
        "Your manuscript is now queued for publication. You will receive a further notification "
        "once it has been formally published.\n\n"
        "Best regards,\nThe JCAS Editorial Team"
    )
    if db:
        s, b = _get_template(db, "payment_confirmed")
        if s: subject_tmpl = s
        if b: body_tmpl    = b
    ctx = {"author_name": author_name, "manuscript_id": manuscript_id,
           "manuscript_title": title, "frontend_url": settings.FRONTEND_URL}
    send_email(author_email, _render(subject_tmpl, ctx), _render(body_tmpl, ctx))
