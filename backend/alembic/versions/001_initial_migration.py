"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2025-01-27

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # This migration will be auto-generated when models are imported
    # For now, this is a placeholder
    pass


def downgrade() -> None:
    pass

