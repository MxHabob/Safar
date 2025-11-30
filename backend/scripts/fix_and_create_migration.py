#!/usr/bin/env python3
"""
سكريبت لإصلاح مشكلة Alembic وإنشاء Migration الأولي
Script to fix Alembic revision error and create initial migration

Usage:
    python scripts/fix_and_create_migration.py
    or
    docker exec <container_id> python scripts/fix_and_create_migration.py
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import get_settings
import asyncpg


async def drop_alembic_version():
    """Drop alembic_version table if it exists"""
    settings = get_settings()
    db_url = str(settings.database_url).replace('+asyncpg', '')
    
    print("🔍 Connecting to database...")
    try:
        conn = await asyncpg.connect(db_url)
        try:
            # Check if table exists
            table_exists = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'alembic_version'
                )
            """)
            
            if table_exists:
                print("📋 Found alembic_version table, dropping it...")
                await conn.execute('DROP TABLE IF EXISTS alembic_version')
                print("✅ alembic_version table dropped successfully")
            else:
                print("ℹ️  alembic_version table does not exist (this is OK)")
        finally:
            await conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


async def main():
    """Main function"""
    print("🚀 Fixing Alembic and creating initial migration...")
    print()
    
    # Drop alembic_version table
    await drop_alembic_version()
    
    print()
    print("✅ Database is ready for new migration")
    print()
    print("📋 Next step: Create migration using:")
    print("   alembic revision --autogenerate -m \"initial\"")
    print()
    print("   Or run:")
    print("   docker exec <container_id> alembic revision --autogenerate -m \"initial\"")


if __name__ == "__main__":
    asyncio.run(main())

