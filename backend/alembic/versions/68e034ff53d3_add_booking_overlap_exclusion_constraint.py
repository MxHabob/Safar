"""add booking overlap exclusion constraint

Revision ID: 68e034ff53d3
Revises: e9e08ac24554
Create Date: 2025-12-01 14:42:37.091080

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '68e034ff53d3'
down_revision: Union[str, None] = 'e9e08ac24554'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create exclusion constraint to prevent overlapping bookings for the same listing.
    #
    # Logic:
    # - Uses a GIST index on:
    #     * listing_id with equality
    #     * tstzrange(check_in, check_out, '[)') with overlap (&&)
    # - Applies ONLY to "active" booking statuses that can block dates:
    #     pending, confirmed, checked_in
    #
    # This MUST stay in sync with any business logic that defines which
    # statuses should block availability.
    op.execute(
        sa.text(
            """
            ALTER TABLE bookings
            ADD CONSTRAINT excl_booking_overlap
            EXCLUDE USING GIST (
                listing_id WITH =,
                tstzrange(check_in, check_out, '[)') WITH &&
            )
            WHERE (status IN ('pending', 'confirmed', 'checked_in'));
            """
        )
    )


def downgrade() -> None:
    # Drop the exclusion constraint if it exists
    op.execute(
        sa.text(
            """
            ALTER TABLE bookings
            DROP CONSTRAINT IF EXISTS excl_booking_overlap;
            """
        )
    )

