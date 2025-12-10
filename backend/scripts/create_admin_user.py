"""
Script to create admin users in the backend.

This script allows you to create admin or super_admin users from the command line.

Usage:
    python -m scripts.create_admin_user --email admin@example.com --password SecurePass123! --role admin
    python -m scripts.create_admin_user --email superadmin@example.com --password SecurePass123! --role super_admin --first-name "Super" --last-name "Admin"
"""
import asyncio
import sys
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, init_db
from app.core.id import generate_typed_id
from app.core.security import get_password_hash
from app.modules.users.models import User, UserRole, UserStatus


async def create_admin_user(
    email: str,
    password: str,
    role: str = "admin",
    first_name: str = None,
    last_name: str = None,
    username: str = None,
    is_email_verified: bool = True,
) -> User:
    """
    Create an admin user in the database.
    
    Args:
        email: User email address (required, must be unique)
        password: Plain text password (will be hashed)
        role: User role - either "admin" or "super_admin" (default: "admin")
        first_name: User's first name (optional)
        last_name: User's last name (optional)
        username: Username (optional, will use email prefix if not provided)
        is_email_verified: Whether email is verified (default: True for admins)
    
    Returns:
        Created User object
    
    Raises:
        ValueError: If email already exists or role is invalid
    """
    # Validate role
    if role not in ["admin", "super_admin"]:
        raise ValueError(f"Invalid role: {role}. Must be 'admin' or 'super_admin'")
    
    # Initialize database schema
    await init_db()
    
    async with AsyncSessionLocal() as session:
        # Check if user with this email already exists
        result = await session.execute(
            select(User).where(User.email == email)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise ValueError(f"User with email '{email}' already exists")
        
        # Check if username is provided and unique
        if username:
            result = await session.execute(
                select(User).where(User.username == username)
            )
            existing_username = result.scalar_one_or_none()
            if existing_username:
                raise ValueError(f"User with username '{username}' already exists")
        else:
            # Generate username from email if not provided
            username = email.split("@")[0]
            # Check if generated username is unique
            result = await session.execute(
                select(User).where(User.username == username)
            )
            existing_username = result.scalar_one_or_none()
            if existing_username:
                # Append a number to make it unique
                counter = 1
                base_username = username
                while existing_username:
                    username = f"{base_username}{counter}"
                    result = await session.execute(
                        select(User).where(User.username == username)
                    )
                    existing_username = result.scalar_one_or_none()
                    counter += 1
        
        # Generate full name
        if first_name and last_name:
            full_name = f"{first_name} {last_name}"
        elif first_name:
            full_name = first_name
        elif last_name:
            full_name = last_name
        else:
            full_name = username or email.split("@")[0]
        
        # Hash password
        hashed_password = get_password_hash(password)
        
        # Determine user role enum
        user_role = UserRole.ADMIN if role == "admin" else UserRole.SUPER_ADMIN
        
        # Create user
        admin_user = User(
            id=generate_typed_id("usr"),
            email=email,
            username=username,
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            full_name=full_name,
            role=user_role,
            roles=[role],  # Also add to roles array
            status=UserStatus.ACTIVE,
            is_active=True,
            is_email_verified=is_email_verified,
            is_phone_verified=False,
            language="ar",
            locale="en",
            currency="USD",
        )
        
        session.add(admin_user)
        await session.commit()
        await session.refresh(admin_user)
        
        return admin_user


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Create an admin user in the database",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create a basic admin user
  python -m scripts.create_admin_user --email admin@example.com --password SecurePass123!
  
  # Create a super admin with full details
  python -m scripts.create_admin_user \\
    --email superadmin@example.com \\
    --password SecurePass123! \\
    --role super_admin \\
    --first-name "Super" \\
    --last-name "Admin" \\
    --username superadmin
        """
    )
    
    parser.add_argument(
        "--email",
        type=str,
        required=True,
        help="Email address for the admin user (required, must be unique)"
    )
    
    parser.add_argument(
        "--password",
        type=str,
        required=True,
        help="Password for the admin user (required)"
    )
    
    parser.add_argument(
        "--role",
        type=str,
        choices=["admin", "super_admin"],
        default="admin",
        help="User role: 'admin' or 'super_admin' (default: admin)"
    )
    
    parser.add_argument(
        "--first-name",
        type=str,
        dest="first_name",
        help="First name of the admin user (optional)"
    )
    
    parser.add_argument(
        "--last-name",
        type=str,
        dest="last_name",
        help="Last name of the admin user (optional)"
    )
    
    parser.add_argument(
        "--username",
        type=str,
        help="Username for the admin user (optional, will use email prefix if not provided)"
    )
    
    parser.add_argument(
        "--unverified",
        action="store_true",
        help="Create user with unverified email (default: email is verified)"
    )
    
    args = parser.parse_args()
    
    try:
        print(f"🔧 Creating {args.role} user...")
        print(f"   Email: {args.email}")
        print(f"   Username: {args.username or 'auto-generated'}")
        
        user = await create_admin_user(
            email=args.email,
            password=args.password,
            role=args.role,
            first_name=args.first_name,
            last_name=args.last_name,
            username=args.username,
            is_email_verified=not args.unverified,
        )
        
        print(f"✅ Successfully created {args.role} user!")
        print(f"   User ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Username: {user.username}")
        print(f"   Full Name: {user.full_name or 'N/A'}")
        print(f"   Role: {user.role.value}")
        print(f"   Status: {user.status.value}")
        print(f"   Email Verified: {user.is_email_verified}")
        
    except ValueError as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

