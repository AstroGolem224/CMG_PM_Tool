"""add project view uniqueness constraints"""

from alembic import op
import sqlalchemy as sa


revision = "20260318_0005"
down_revision = "20260317_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    if inspector.has_table("projectview"):
        default_rows = connection.execute(
            sa.text(
                """
                SELECT id, project_id
                FROM projectview
                WHERE is_default = 1
                ORDER BY project_id, updated_at DESC, position ASC
                """
            )
        ).mappings()

        seen_projects: set[str] = set()
        for row in default_rows:
            if row["project_id"] in seen_projects:
                connection.execute(
                    sa.text("UPDATE projectview SET is_default = 0 WHERE id = :id"),
                    {"id": row["id"]},
                )
                continue
            seen_projects.add(row["project_id"])

    op.create_index(
        "uq_project_view_project_name",
        "projectview",
        ["project_id", "name"],
        unique=True,
    )
    op.create_index(
        "ix_project_view_single_default",
        "projectview",
        ["project_id"],
        unique=True,
        sqlite_where=sa.text("is_default = 1"),
    )


def downgrade() -> None:
    op.drop_index("ix_project_view_single_default", table_name="projectview")
    op.drop_index("uq_project_view_project_name", table_name="projectview")
