from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.core.config import settings

from app.core.dependencies import get_db, get_current_active_user, require_role
from app.models.user import User, UserRole
from app.models.article import Volume, Issue, Article, Notification
from app.models.manuscript import Manuscript, ManuscriptStatus, AccessType
from app.schemas.article import (
    VolumeCreate, IssueCreate, VolumeOut, IssueOut,
    ArticleOut, PublishArticle, NotificationOut,
)

router = APIRouter(tags=["Archive"])

def _build_article_out(art, ms, iss=None, vol=None):
    from app.schemas.article import ArticleAuthorOut

    authors = []
    if ms and ms.co_authors:
        authors = [
            ArticleAuthorOut(
                name=a.name,
                affiliation=a.affiliation,
                is_corresponding=a.is_corresponding,
            )
            for a in sorted(ms.co_authors, key=lambda x: x.author_order)
        ]

    if iss is None and art.issue_id:
        iss = art.issue
    if vol is None and iss:
        vol = iss.volume

    return ArticleOut(
        id=art.id,
        manuscript_id=art.manuscript_id,
        issue_id=art.issue_id,
        doi=art.doi,
        pages=art.pages,
        page_start=art.page_start,
        page_end=art.page_end,
        access_type=art.access_type,
        published_at=art.published_at,
        download_count=art.download_count,
        citation_count=art.citation_count,
        view_count=art.view_count,
        title=ms.title           if ms  else None,
        abstract=ms.abstract     if ms  else None,
        keywords=ms.keywords     if ms  else None,
        article_type=ms.article_type if ms else None,
        authors=authors,
        volume_number=vol.volume_number if vol else None,
        issue_number=iss.issue_number   if iss else None,
        year=vol.year                   if vol else None,
    )


# ── Public: browse archive ────────────────────────────────────────────────

@router.get("/volumes", response_model=List[VolumeOut])
def list_volumes(db: Session = Depends(get_db)):
    volumes = (
        db.query(Volume)
        .options(joinedload(Volume.issues))
        .order_by(Volume.volume_number.desc())
        .all()
    )
    result = []
    for vol in volumes:
        issues_out = []
        for iss in vol.issues:
            count = db.query(Article).filter(Article.issue_id == iss.id).count()
            issues_out.append(IssueOut(
                id=iss.id,
                volume_id=iss.volume_id,
                issue_number=iss.issue_number,
                period=iss.period,
                published_at=iss.published_at,
                is_published=iss.is_published,
                article_count=count,
            ))
        result.append(VolumeOut(
            id=vol.id,
            volume_number=vol.volume_number,
            year=vol.year,
            issues=issues_out,
        ))
    return result


@router.get("/volumes/{volume_number}/issues/{issue_number}/articles",
            response_model=List[ArticleOut])
def list_issue_articles(
    volume_number: int,
    issue_number: int,
    access_type: Optional[str] = None,
    article_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    volume = db.query(Volume).filter(Volume.volume_number == volume_number).first()
    if not volume:
        raise HTTPException(status_code=404, detail="Volume not found")

    issue = db.query(Issue).filter(
        Issue.volume_id == volume.id,
        Issue.issue_number == issue_number,
    ).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    q = (
        db.query(Article)
        .options(
            joinedload(Article.manuscript).joinedload(Manuscript.co_authors),
            joinedload(Article.issue).joinedload(Issue.volume),
        )
        .join(Manuscript, Article.manuscript_id == Manuscript.id)
        .filter(Article.issue_id == issue.id)
    )
    if access_type:
        q = q.filter(Article.access_type == access_type)
    if article_type:
        q = q.filter(Manuscript.article_type == article_type)

    articles = q.order_by(Article.page_start).offset(skip).limit(limit).all()
    return [_build_article_out(art, art.manuscript, issue, volume) for art in articles]


@router.get("/articles/{article_id}", response_model=ArticleOut)
def get_article(article_id: int, db: Session = Depends(get_db)):
    art = (
        db.query(Article)
        .options(
            joinedload(Article.manuscript).joinedload(Manuscript.co_authors),
            joinedload(Article.issue).joinedload(Issue.volume),
        )
        .filter(Article.id == article_id)
        .first()
    )
    if not art:
        raise HTTPException(status_code=404, detail="Article not found")

    art.view_count += 1
    db.commit()

    return _build_article_out(art, art.manuscript)


@router.get("/articles/doi/{doi:path}", response_model=ArticleOut)
def get_article_by_doi(doi: str, db: Session = Depends(get_db)):
    art = db.query(Article).filter(Article.doi == doi).first()
    if not art:
        raise HTTPException(status_code=404, detail="Article not found")
    return get_article(art.id, db)


@router.get("/search", response_model=List[ArticleOut])
def search_articles(
    q: Optional[str] = Query(None, min_length=2),
    year: Optional[int] = None,
    access_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    query = (
        db.query(Article)
        .options(
            joinedload(Article.manuscript).joinedload(Manuscript.co_authors),
            joinedload(Article.issue).joinedload(Issue.volume),
        )
        .join(Manuscript, Article.manuscript_id == Manuscript.id)
        .outerjoin(Issue, Article.issue_id == Issue.id)
        .outerjoin(Volume, Issue.volume_id == Volume.id)
    )
    if q:
        like = f"%{q}%"
        query = query.filter(
            Manuscript.title.ilike(like)
            | Manuscript.abstract.ilike(like)
            | Manuscript.keywords.ilike(like)
        )
    if year:
        query = query.filter(Volume.year == year)
    if access_type:
        query = query.filter(Article.access_type == access_type)

    articles = query.order_by(Article.published_at.desc()).offset(skip).limit(limit).all()
    return [_build_article_out(art, art.manuscript) for art in articles]

@router.post("/articles/{article_id}/download")
def record_download(article_id: int, db: Session = Depends(get_db)):
    art = db.query(Article).filter(Article.id == article_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="Article not found")
    art.download_count += 1
    db.commit()
    return {"detail": "Download recorded"}


# ── Editor: publish articles ──────────────────────────────────────────────

@router.post("/volumes", response_model=VolumeOut, status_code=201)
def create_volume(
    payload: VolumeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.EDITOR)),
):
    if db.query(Volume).filter(Volume.volume_number == payload.volume_number).first():
        raise HTTPException(status_code=409, detail="Volume number already exists")
    vol = Volume(volume_number=payload.volume_number, year=payload.year)
    db.add(vol)
    db.commit()
    db.refresh(vol)
    return VolumeOut(id=vol.id, volume_number=vol.volume_number, year=vol.year, issues=[])


@router.post("/issues", response_model=IssueOut, status_code=201)
def create_issue(
    payload: IssueCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.EDITOR)),
):
    vol = db.query(Volume).filter(Volume.id == payload.volume_id).first()
    if not vol:
        raise HTTPException(status_code=404, detail="Volume not found")
    iss = Issue(
        volume_id=payload.volume_id,
        issue_number=payload.issue_number,
        period=payload.period,
    )
    db.add(iss)
    db.commit()
    db.refresh(iss)
    return IssueOut(
        id=iss.id, volume_id=iss.volume_id, issue_number=iss.issue_number,
        period=iss.period, published_at=iss.published_at,
        is_published=iss.is_published, article_count=0,
    )


@router.get("/public-stats")
def public_journal_stats(db: Session = Depends(get_db)):
    """
    Lightweight, unauthenticated stats for the public homepage.
    Only meaningful once the journal has a real publication history —
    the frontend decides whether to use these numbers or the placeholder
    copy based on `published_count`.
    """
    from sqlalchemy import func

    published_count = db.query(func.count(Article.id)).scalar() or 0

    decided = db.query(func.count(Manuscript.id)).filter(
        Manuscript.status.in_([
            ManuscriptStatus.ACCEPTED, ManuscriptStatus.PUBLISHED, ManuscriptStatus.REJECTED,
        ])
    ).scalar() or 0
    accepted = db.query(func.count(Manuscript.id)).filter(
        Manuscript.status.in_([ManuscriptStatus.ACCEPTED, ManuscriptStatus.PUBLISHED])
    ).scalar() or 0
    acceptance_rate = round((accepted / decided) * 100, 1) if decided else None

    active_reviewers = db.query(func.count(User.id)).filter(
        User.role == UserRole.REVIEWER,
        User.is_active.is_(True),
        User.is_approved.is_(True),
    ).scalar() or 0

    latest_volume = db.query(Volume).order_by(Volume.volume_number.desc()).first()

    return {
        "published_count":  published_count,
        "acceptance_rate":  acceptance_rate,
        "active_reviewers": active_reviewers,
        "current_volume":   latest_volume.volume_number if latest_volume else None,
    }

# ── Notifications ─────────────────────────────────────────────────────────

@router.get("/notifications", response_model=List[NotificationOut])
def get_my_notifications(
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        q = q.filter(Notification.is_read.is_(False))
    return q.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/notifications/{notification_id}/read", status_code=200)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"detail": "Marked as read"}


@router.post("/notifications/read-all", status_code=200)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()
    return {"detail": "All notifications marked as read"}