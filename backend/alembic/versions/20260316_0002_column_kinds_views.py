"""add column kinds and project views"""

from alembic import op
import sqlalchemy as sa


revision = "20260316_0002"
down_revision = "20260316_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "column",
        sa.Column("kind", sa.String(), nullable=False, server_default="custom"),
    )
    op.create_index("ix_column_kind", "column", ["kind"])

    op.execute(
        """
        UPDATE "column"
        SET kind = CASE
            WHEN name = 'Backlog' THEN 'backlog'
            WHEN name = 'In Progress' THEN 'in_progress'
            WHEN name = 'Review' THEN 'review'
            WHEN name = 'Done' THEN 'done'
            ELSE 'custom'
        END
        """
    )

    op.create_table(
        "projectview",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("project_id", sa.String(), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("label_ids", sa.String(), nullable=False, server_default=""),
        sa.Column("priorities", sa.String(), nullable=False, server_default=""),
        sa.Column("completion", sa.String(), nullable=False, server_default="all"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_projectview_project_id", "projectview", ["project_id"])


def downgrade() -> None:
    op.drop_index("ix_projectview_project_id", table_name="projectview")
    op.drop_table("projectview")
    op.drop_index("ix_column_kind", table_name="column")
    op.drop_column("column", "kind")
