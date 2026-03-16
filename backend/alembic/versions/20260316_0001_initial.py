"""initial schema"""

from alembic import op
import sqlalchemy as sa


revision = "20260316_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "project",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False, server_default=""),
        sa.Column("color", sa.String(), nullable=False, server_default="#6366f1"),
        sa.Column("status", sa.String(), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_project_status", "project", ["status"])

    op.create_table(
        "activityevent",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("task_title", sa.String(), nullable=False, server_default=""),
        sa.Column("project_name", sa.String(), nullable=False),
        sa.Column("project_id", sa.String(), nullable=False),
        sa.Column("task_id", sa.String(), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_activityevent_timestamp", "activityevent", ["timestamp"])

    op.create_table(
        "column",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("project_id", sa.String(), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("color", sa.String(), nullable=False, server_default="#475569"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_column_project_id", "column", ["project_id"])

    op.create_table(
        "label",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("project_id", sa.String(), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("color", sa.String(), nullable=False, server_default="#3b82f6"),
    )
    op.create_index("ix_label_project_id", "label", ["project_id"])

    op.create_table(
        "task",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("project_id", sa.String(), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("column_id", sa.String(), sa.ForeignKey("column.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False, server_default=""),
        sa.Column("priority", sa.String(), nullable=False, server_default="medium"),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_task_project_id", "task", ["project_id"])
    op.create_index("ix_task_column_id", "task", ["column_id"])
    op.create_index("ix_task_position", "task", ["position"])

    op.create_table(
        "comment",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("task_id", sa.String(), sa.ForeignKey("task.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_comment_task_id", "comment", ["task_id"])

    op.create_table(
        "tasklabellink",
        sa.Column("task_id", sa.String(), sa.ForeignKey("task.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("label_id", sa.String(), sa.ForeignKey("label.id", ondelete="CASCADE"), primary_key=True),
    )


def downgrade() -> None:
    op.drop_table("tasklabellink")
    op.drop_index("ix_comment_task_id", table_name="comment")
    op.drop_table("comment")
    op.drop_index("ix_task_position", table_name="task")
    op.drop_index("ix_task_column_id", table_name="task")
    op.drop_index("ix_task_project_id", table_name="task")
    op.drop_table("task")
    op.drop_index("ix_label_project_id", table_name="label")
    op.drop_table("label")
    op.drop_index("ix_column_project_id", table_name="column")
    op.drop_table("column")
    op.drop_index("ix_activityevent_timestamp", table_name="activityevent")
    op.drop_table("activityevent")
    op.drop_index("ix_project_status", table_name="project")
    op.drop_table("project")
