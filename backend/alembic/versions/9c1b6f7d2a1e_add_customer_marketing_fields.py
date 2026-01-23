"""add customer marketing fields

Revision ID: 9c1b6f7d2a1e
Revises: 4a2f4f5c2d3e
Create Date: 2026-01-23

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9c1b6f7d2a1e"
down_revision: Union[str, Sequence[str], None] = "4a2f4f5c2d3e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("customers", sa.Column("email", sa.String(length=254), nullable=True))
    op.add_column("customers", sa.Column("dob", sa.Date(), nullable=True))
    op.add_column("customers", sa.Column("gender", sa.String(length=10), nullable=True))
    op.add_column("customers", sa.Column("anniversary", sa.Date(), nullable=True))
    op.add_column("customers", sa.Column("referral_source", sa.String(length=200), nullable=True))
    op.add_column(
        "customers",
        sa.Column("marketing_consent", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "customers",
        sa.Column("whatsapp_opt_in", sa.Boolean(), nullable=False, server_default=sa.true()),
    )


def downgrade() -> None:
    op.drop_column("customers", "whatsapp_opt_in")
    op.drop_column("customers", "marketing_consent")
    op.drop_column("customers", "referral_source")
    op.drop_column("customers", "anniversary")
    op.drop_column("customers", "gender")
    op.drop_column("customers", "dob")
    op.drop_column("customers", "email")
