from typing import List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_admin
from app.models.email_template import EmailTemplate
from app.models.user import User
from app.schemas.email_template import EmailTemplateOut, EmailTemplateUpdate

router = APIRouter(prefix="/email-templates", tags=["Email Templates"])

# Default templates — used for seeding and reset
DEFAULT_TEMPLATES = {
    "welcome": {
        "label":   "Welcome Email",
        "subject": "Welcome to JCAS — Your Account is Ready",
        "body": """Dear {author_name},

Welcome to the Journal of Computing & Applied Sciences (JCAS).

Your account has been created successfully. You can now log in to submit manuscripts, track your submissions, and engage with the peer review process.

Login at: {frontend_url}/login

Best regards,
The JCAS Editorial Team""",
    },
    "email_verification": {
        "label":   "Confirm Email Address",
        "subject": "JCAS — Confirm Your Email Address",
        "body": """Dear {author_name},

Thanks for registering with JCAS. Please confirm your email address by clicking the link below (valid for 48 hours):

{verify_url}

If you did not create this account, you can safely ignore this email.

Best regards,
The JCAS Editorial Team""",
    },
    "admin_verification_notice": {
        "label":   "Admin: Author Verification Notice",
        "subject": "JCAS — Author Email {status}: {user_name}",
        "body": """Hello,

The author {user_name} ({user_email}) {status_word} their email address.

Best regards,
The JCAS System""",
    },
    "password_reset": {
        "label":   "Password Reset",
        "subject": "JCAS — Password Reset Request",
        "body": """Dear {author_name},

We received a request to reset your JCAS account password.

Click the link below to set a new password (valid for 30 minutes):
{reset_url}

If you did not request a password reset, please ignore this email.

Best regards,
The JCAS Editorial Team""",
    },
    "submission_confirmation": {
        "label":   "Submission Confirmation",
        "subject": "JCAS — Manuscript Received: {manuscript_id}",
        "body": """Dear {author_name},

Thank you for submitting your manuscript "{manuscript_title}" to the Journal of Computing & Applied Sciences (JCAS).

Your Manuscript ID is: {manuscript_id}

We will assign a handling editor within 5 working days and keep you updated on the progress of your submission.

Best regards,
The JCAS Editorial Team""",
    },
    "review_invitation": {
        "label":   "Review Invitation",
        "subject": "JCAS — Invitation to Review a Manuscript",
        "body": """Dear {reviewer_name},

We would like to invite you to review the manuscript "{manuscript_title}" submitted to JCAS.

Review Deadline: {deadline}

Please log in to your reviewer dashboard to accept or decline this invitation:
{frontend_url}/dashboard/reviewer/invitations

If you have any conflict of interest with this manuscript, please decline and let us know.

Thank you for supporting open science.

Best regards,
The JCAS Editorial Team""",
    },
    "decision_notification": {
        "label":   "Decision Notification",
        "subject": "JCAS — Editorial Decision for {manuscript_id}",
        "body": """Dear {author_name},

An editorial decision has been made regarding your manuscript "{manuscript_title}".

Decision: {decision}

Please log in to your author dashboard to view the full decision letter and reviewer comments:
{frontend_url}/dashboard/author

Best regards,
The JCAS Editorial Team""",
    },
    "revision_reminder": {
        "label":   "Revision Reminder",
        "subject": "JCAS — Revision Reminder: {manuscript_id}",
        "body": """Dear {author_name},

This is a friendly reminder that your revised manuscript "{manuscript_title}" is due on {deadline}.

Please log in to your author dashboard to upload your revised manuscript:
{frontend_url}/dashboard/author

If you require an extension, please contact the editorial office as soon as possible.

Best regards,
The JCAS Editorial Team""",
    },
    "screening_declined": {
        "label":   "Screening Declined",
        "subject": "JCAS — Submission Decision: {manuscript_id}",
        "body": """Dear {author_name},

Thank you for submitting your manuscript "{manuscript_title}" (ID: {manuscript_id}) to JCAS.

After initial editorial screening, we regret to inform you that your submission does not meet our current scope or formatting requirements and will not proceed to peer review at this time.

Reason: {reason}

We encourage you to consider revising your manuscript and submitting to a more suitable venue.

Best regards,
The JCAS Editorial Office""",
    },
    "reviewer_assigned": {
        "label":   "Reviewer Assignment Confirmed",
        "subject": "JCAS — You Have Been Assigned to Review a Manuscript",
        "body": """Dear {reviewer_name},

You have been assigned to review the manuscript titled "{manuscript_title}" (ID: {manuscript_id}).

Please log in to your reviewer dashboard to accept or decline this assignment.
Review Deadline: {deadline}

Dashboard: {dashboard_url}

Best regards,
The JCAS Editorial Team""",
    },
    "payment_confirmed": {
        "label":   "Payment Confirmed",
        "subject": "JCAS — APC Payment Confirmed: {manuscript_id}",
        "body": """Dear {author_name},

We are pleased to confirm that your Article Processing Charge (APC) for the manuscript "{manuscript_title}" (ID: {manuscript_id}) has been received and verified.

Your manuscript is now queued for publication. You will receive a further notification once it has been formally published.

Best regards,
The JCAS Editorial Team""",
    },
}


def seed_default_templates(db: Session):
    """Called on startup — inserts missing templates."""
    for key, tmpl in DEFAULT_TEMPLATES.items():
        if not db.query(EmailTemplate).filter(EmailTemplate.key == key).first():
            db.add(EmailTemplate(key=key, label=tmpl["label"],
                                 subject=tmpl["subject"], body=tmpl["body"]))
    db.commit()


@router.get("", response_model=List[EmailTemplateOut])
def list_templates(
    db: Session = Depends(get_db),
    _:  User    = Depends(require_admin),
):
    return db.query(EmailTemplate).order_by(EmailTemplate.key).all()


@router.patch("/{key}", response_model=EmailTemplateOut)
def update_template(
    key:          str,
    payload:      EmailTemplateUpdate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin),
):
    tmpl = db.query(EmailTemplate).filter(EmailTemplate.key == key).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    if payload.subject is not None: tmpl.subject    = payload.subject
    if payload.body    is not None: tmpl.body       = payload.body
    tmpl.updated_at = datetime.now(timezone.utc)
    tmpl.updated_by = current_user.id
    db.commit()
    db.refresh(tmpl)
    return tmpl


@router.post("/{key}/reset", response_model=EmailTemplateOut)
def reset_template(
    key: str,
    db:  Session = Depends(get_db),
    _:   User    = Depends(require_admin),
):
    default = DEFAULT_TEMPLATES.get(key)
    if not default:
        raise HTTPException(status_code=404, detail="Template not found")
    tmpl = db.query(EmailTemplate).filter(EmailTemplate.key == key).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    tmpl.subject    = default["subject"]
    tmpl.body       = default["body"]
    tmpl.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(tmpl)
    return tmpl