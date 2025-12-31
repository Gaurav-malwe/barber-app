"""make customer phone optional

Revision ID: 4a2f4f5c2d3e
Revises: b199766e5898
Create Date: 2025-12-31

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4a2f4f5c2d3e"
down_revision: Union[str, Sequence[str], None] = "b199766e5898"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "customers",
        "phone",
        existing_type=sa.String(length=20),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "customers",
        "phone",
        existing_type=sa.String(length=20),
        nullable=False,
    )
