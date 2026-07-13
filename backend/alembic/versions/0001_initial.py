"""Initial schema — create all JCAS tables

Revision ID: 0001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id",              sa.Integer(),     primary_key=True),
        sa.Column("email",           sa.String(255),   nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255),   nullable=False),
        sa.Column("name",            sa.String(255),   nullable=False),
        sa.Column("role",            sa.Enum("author","reviewer","editor","admin",
                                            name="userrole"), nullable=False),
        sa.Column("affiliation",     sa.String(500),   nullable=True),
        sa.Column("orcid",           sa.String(50),    nullable=True),
        sa.Column("bio",             sa.Text(),        nullable=True),
        sa.Column("expertise_areas", sa.Text(),        nullable=True),
        sa.Column("is_active",       sa.Boolean(),     default=True),
        sa.Column("is_verified",     sa.Boolean(),     default=False),
        sa.Column("created_at",      sa.DateTime(timezone=True)),
        sa.Column("updated_at",      sa.DateTime(timezone=True)),
        sa.Column("last_login",      sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── manuscripts ──────────────────────────────────────────────────────
    op.create_table(
        "manuscripts",
        sa.Column("id",              sa.Integer(),  primary_key=True),
        sa.Column("manuscript_id",   sa.String(30), nullable=False, unique=True),
        sa.Column("title",           sa.String(1000), nullable=False),
        sa.Column("article_type",    sa.Enum(
            "Research Article","Review Paper","Short Communication",
            "Technical Note","Letter to the Editor", name="articletype"),
            nullable=False),
        sa.Column("abstract",        sa.Text(),     nullable=False),
        sa.Column("keywords",        sa.String(1000), nullable=False),
        sa.Column("subject_area",    sa.String(200), nullable=True),
        sa.Column("status",          sa.Enum(
            "draft","submitted","editor_assigned","under_review",
            "revision_required","revision_submitted","accepted",
            "rejected","published","withdrawn", name="manuscriptstatus"),
            nullable=False),
        sa.Column("cover_letter",    sa.Text(),     nullable=True),
        sa.Column("revision_number", sa.Integer(),  default=0),
        sa.Column("submitter_id",    sa.Integer(),  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("editor_id",       sa.Integer(),  sa.ForeignKey("users.id"), nullable=True),
        sa.Column("policy_data",     postgresql.JSON(), nullable=True),
        sa.Column("created_at",      sa.DateTime(timezone=True)),
        sa.Column("submitted_at",    sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at",      sa.DateTime(timezone=True)),
        sa.Column("decision_at",     sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_manuscripts_manuscript_id", "manuscripts", ["manuscript_id"], unique=True)
    op.create_index("ix_manuscripts_status",        "manuscripts", ["status"])

    # ── manuscript_authors ───────────────────────────────────────────────
    op.create_table(
        "manuscript_authors",
        sa.Column("id",               sa.Integer(), primary_key=True),
        sa.Column("manuscript_id",    sa.Integer(), sa.ForeignKey("manuscripts.id"), nullable=False),
        sa.Column("user_id",          sa.Integer(), sa.ForeignKey("users.id"),       nullable=True),
        sa.Column("name",             sa.String(255), nullable=False),
        sa.Column("email",            sa.String(255), nullable=False),
        sa.Column("affiliation",      sa.String(500), nullable=True),
        sa.Column("orcid",            sa.String(50),  nullable=True),
        sa.Column("is_corresponding", sa.Boolean(),   default=False),
        sa.Column("author_order",     sa.Integer(),   default=0),
    )

    # ── manuscript_files ─────────────────────────────────────────────────
    op.create_table(
        "manuscript_files",
        sa.Column("id",            sa.Integer(),  primary_key=True),
        sa.Column("manuscript_id", sa.Integer(),  sa.ForeignKey("manuscripts.id"), nullable=False),
        sa.Column("file_type",     sa.String(50), nullable=False),
        sa.Column("filename",      sa.String(500), nullable=False),
        sa.Column("stored_name",   sa.String(500), nullable=False),
        sa.Column("file_path",     sa.String(1000), nullable=False),
        sa.Column("file_size",     sa.Integer(),  nullable=True),
        sa.Column("mime_type",     sa.String(100), nullable=True),
        sa.Column("uploaded_at",   sa.DateTime(timezone=True)),
    )

    # ── manuscript_status_history ────────────────────────────────────────
    op.create_table(
        "manuscript_status_history",
        sa.Column("id",            sa.Integer(), primary_key=True),
        sa.Column("manuscript_id", sa.Integer(), sa.ForeignKey("manuscripts.id"), nullable=False),
        sa.Column("from_status",   sa.Enum(
            "draft","submitted","editor_assigned","under_review",
            "revision_required","revision_submitted","accepted",
            "rejected","published","withdrawn", name="manuscriptstatus"),
            nullable=True),
        sa.Column("to_status",     sa.Enum(
            "draft","submitted","editor_assigned","under_review",
            "revision_required","revision_submitted","accepted",
            "rejected","published","withdrawn", name="manuscriptstatus"),
            nullable=False),
        sa.Column("changed_by",    sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("note",          sa.Text(),    nullable=True),
        sa.Column("changed_at",    sa.DateTime(timezone=True)),
    )

    # ── review_assignments ───────────────────────────────────────────────
    op.create_table(
        "review_assignments",
        sa.Column("id",             sa.Integer(), primary_key=True),
        sa.Column("manuscript_id",  sa.Integer(), sa.ForeignKey("manuscripts.id"), nullable=False),
        sa.Column("reviewer_id",    sa.Integer(), sa.ForeignKey("users.id"),       nullable=False),
        sa.Column("assigned_by",    sa.Integer(), sa.ForeignKey("users.id"),       nullable=True),
        sa.Column("status",         sa.Enum(
            "invited","accepted","declined","in_progress","submitted","overdue",
            name="reviewstatus"), nullable=False),
        sa.Column("deadline",       sa.DateTime(timezone=True), nullable=True),
        sa.Column("assigned_at",    sa.DateTime(timezone=True)),
        sa.Column("responded_at",   sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at",   sa.DateTime(timezone=True), nullable=True),
        sa.Column("decline_reason", sa.Text(),    nullable=True),
        sa.Column("round_number",   sa.Integer(), default=1),
    )
    op.create_index("ix_review_assignments_status", "review_assignments", ["status"])

    # ── reviews ──────────────────────────────────────────────────────────
    op.create_table(
        "reviews",
        sa.Column("id",                    sa.Integer(), primary_key=True),
        sa.Column("assignment_id",         sa.Integer(),
                  sa.ForeignKey("review_assignments.id"), unique=True, nullable=False),
        sa.Column("score_originality",     sa.Integer(), nullable=True),
        sa.Column("score_technical",       sa.Integer(), nullable=True),
        sa.Column("score_clarity",         sa.Integer(), nullable=True),
        sa.Column("score_references",      sa.Integer(), nullable=True),
        sa.Column("recommendation",        sa.Enum(
            "accept","minor_revision","major_revision","reject",
            name="reviewrecommendation"), nullable=True),
        sa.Column("comments_to_author",    sa.Text(), nullable=True),
        sa.Column("comments_to_editor",    sa.Text(), nullable=True),
        sa.Column("conflict_declaration",  sa.Text(), nullable=True),
        sa.Column("is_draft",              sa.Boolean(), default=True),
        sa.Column("submitted_at",          sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at",            sa.DateTime(timezone=True)),
        sa.Column("updated_at",            sa.DateTime(timezone=True)),
    )

    # ── volumes ──────────────────────────────────────────────────────────
    op.create_table(
        "volumes",
        sa.Column("id",            sa.Integer(), primary_key=True),
        sa.Column("volume_number", sa.Integer(), unique=True, nullable=False),
        sa.Column("year",          sa.Integer(), nullable=False),
        sa.Column("created_at",    sa.DateTime(timezone=True)),
    )
    op.create_index("ix_volumes_volume_number", "volumes", ["volume_number"], unique=True)

    # ── issues ───────────────────────────────────────────────────────────
    op.create_table(
        "issues",
        sa.Column("id",           sa.Integer(), primary_key=True),
        sa.Column("volume_id",    sa.Integer(), sa.ForeignKey("volumes.id"), nullable=False),
        sa.Column("issue_number", sa.Integer(), nullable=False),
        sa.Column("period",       sa.String(100), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_published", sa.Boolean(), default=False),
    )

    # ── articles ─────────────────────────────────────────────────────────
    op.create_table(
        "articles",
        sa.Column("id",             sa.Integer(), primary_key=True),
        sa.Column("manuscript_id",  sa.Integer(),
                  sa.ForeignKey("manuscripts.id"), unique=True, nullable=False),
        sa.Column("issue_id",       sa.Integer(),
                  sa.ForeignKey("issues.id"), nullable=True),
        sa.Column("doi",            sa.String(200), unique=True, nullable=True),
        sa.Column("page_start",     sa.Integer(), nullable=True),
        sa.Column("page_end",       sa.Integer(), nullable=True),
        sa.Column("access_type",    sa.Enum("open","subscription", name="accesstype"),
                  nullable=False),
        sa.Column("published_at",   sa.DateTime(timezone=True), nullable=True),
        sa.Column("download_count", sa.Integer(), default=0),
        sa.Column("citation_count", sa.Integer(), default=0),
        sa.Column("view_count",     sa.Integer(), default=0),
        sa.Column("created_at",     sa.DateTime(timezone=True)),
    )
    op.create_index("ix_articles_doi", "articles", ["doi"], unique=True)

    # ── notifications ────────────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id",         sa.Integer(),  primary_key=True),
        sa.Column("user_id",    sa.Integer(),  sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type",       sa.String(100), nullable=False),
        sa.Column("title",      sa.String(500), nullable=False),
        sa.Column("body",       sa.Text(),      nullable=True),
        sa.Column("is_read",    sa.Boolean(),   default=False),
        sa.Column("link",       sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("articles")
    op.drop_table("issues")
    op.drop_table("volumes")
    op.drop_table("reviews")
    op.drop_table("review_assignments")
    op.drop_table("manuscript_status_history")
    op.drop_table("manuscript_files")
    op.drop_table("manuscript_authors")
    op.drop_table("manuscripts")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS articletype")
    op.execute("DROP TYPE IF EXISTS manuscriptstatus")
    op.execute("DROP TYPE IF EXISTS reviewstatus")
    op.execute("DROP TYPE IF EXISTS reviewrecommendation")
    op.execute("DROP TYPE IF EXISTS accesstype")
