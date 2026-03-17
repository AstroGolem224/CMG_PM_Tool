"""add recurring task fields"""

from alembic import op
import sqlalchemy as sa


revision = "20260317_0004"
down_revision = "20260316_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "task",
        sa.Column("recurrence_type", sa.String(), nullable=False, server_default="none"),
    )
    op.add_column(
        "task",
        sa.Column("recurrence_interval", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "task",
        sa.Column("recurrence_days", sa.String(), nullable=False, server_default=""),
    )
    op.add_column(
        "task",
        sa.Column("next_due_date", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("task", "next_due_date")
    op.drop_column("task", "recurrence_days")
    op.drop_column("task", "recurrence_interval")
    op.drop_column("task", "recurrence_type")
