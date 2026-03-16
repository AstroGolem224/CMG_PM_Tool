"""add pinned and default metadata to project views"""

from alembic import op
import sqlalchemy as sa


revision = "20260316_0003"
down_revision = "20260316_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "projectview",
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "projectview",
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "projectview",
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
    )

    connection = op.get_bind()
    single_view_projects = connection.execute(
        sa.text(
            """
            SELECT project_id
            FROM projectview
            GROUP BY project_id
            HAVING COUNT(*) = 1
            """
        )
    ).fetchall()

    for row in single_view_projects:
        connection.execute(
            sa.text(
                """
                UPDATE projectview
                SET is_pinned = 1, is_default = 1
                WHERE project_id = :project_id
                """
            ),
            {"project_id": row[0]},
        )


def downgrade() -> None:
    op.drop_column("projectview", "position")
    op.drop_column("projectview", "is_default")
    op.drop_column("projectview", "is_pinned")
