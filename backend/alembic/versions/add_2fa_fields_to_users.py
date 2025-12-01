"""Add 2FA fields to users

Revision ID: add_2fa_fields
Revises: 68e034ff53d3
Create Date: 2025-01-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_2fa_fields'
down_revision: Union[str, None] = '68e034ff53d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add 2FA fields to users table."""
    # Add TOTP secret
    op.add_column('users', sa.Column('totp_secret', sa.String(length=255), nullable=True))
    
    # Add TOTP enabled flag
    op.add_column('users', sa.Column('totp_enabled', sa.Boolean(), nullable=False, server_default='false'))
    
    # Add backup codes array
    op.add_column('users', sa.Column('backup_codes', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'))
    
    # Create index on totp_enabled for faster queries
    op.create_index('ix_users_totp_enabled', 'users', ['totp_enabled'], unique=False)


def downgrade() -> None:
    """Remove 2FA fields from users table."""
    op.drop_index('ix_users_totp_enabled', table_name='users')
    op.drop_column('users', 'backup_codes')
    op.drop_column('users', 'totp_enabled')
    op.drop_column('users', 'totp_secret')

