#!/usr/bin/env python3
"""
سكريبت لإنشاء Migration الأولي
Script to create initial migration for Safar Backend

Usage:
    python scripts/create_initial_migration.py
    or
    docker-compose exec backend python scripts/create_initial_migration.py
"""
import os
import sys
import subprocess
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def check_docker_compose():
    """Check if docker-compose is available"""
    try:
        subprocess.run(["docker-compose", "--version"], 
                      capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def check_services_running():
    """Check if Docker services are running"""
    try:
        result = subprocess.run(
            ["docker-compose", "ps"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        return "safar_backend" in result.stdout and "Up" in result.stdout
    except Exception:
        return False

def check_existing_migrations():
    """Check if there are existing migrations"""
    versions_dir = Path(__file__).parent.parent / "alembic" / "versions"
    if not versions_dir.exists():
        return []
    
    migrations = list(versions_dir.glob("*.py"))
    # Filter out __init__.py
    migrations = [m for m in migrations if m.name != "__init__.py"]
    return migrations

def create_migration():
    """Create initial migration"""
    backend_dir = Path(__file__).parent.parent
    
    print("🚀 Creating initial migration for Safar Backend...")
    print()
    
    # Check docker-compose
    if not check_docker_compose():
        print("❌ Error: docker-compose is not installed")
        sys.exit(1)
    
    # Check if services are running
    print("📋 Checking if services are running...")
    if not check_services_running():
        print("⚠️  Backend service is not running.")
        response = input("   Do you want to start services? (y/N): ")
        if response.lower() == 'y':
            print("   Starting services...")
            subprocess.run(["docker-compose", "up", "-d"], 
                          cwd=backend_dir)
            print("   ⏳ Waiting for services to be ready...")
            import time
            time.sleep(10)
        else:
            print("❌ Please start services first: docker-compose up -d")
            sys.exit(1)
    
    # Check existing migrations
    existing = check_existing_migrations()
    if existing:
        print("⚠️  Warning: There are existing migrations:")
        for mig in existing:
            print(f"   - {mig.name}")
        print()
        response = input("   Do you want to continue? This will create a new migration. (y/N): ")
        if response.lower() != 'y':
            print("❌ Cancelled.")
            sys.exit(1)
    
    # Create versions directory if it doesn't exist
    versions_dir = backend_dir / "alembic" / "versions"
    versions_dir.mkdir(parents=True, exist_ok=True)
    
    # Create migration
    print("📝 Creating initial migration...")
    try:
        result = subprocess.run(
            ["docker-compose", "exec", "-T", "backend", 
             "alembic", "revision", "--autogenerate", "-m", "initial"],
            cwd=backend_dir,
            capture_output=True,
            text=True,
            check=True
        )
        print(result.stdout)
        
        # Find the created migration
        new_migrations = check_existing_migrations()
        if new_migrations:
            latest = max(new_migrations, key=lambda p: p.stat().st_mtime)
            print()
            print("✅ Initial migration created successfully!")
            print()
            print(f"📄 Migration file: {latest}")
            print()
            print("📋 Next steps:")
            print("   1. Review the migration file")
            print("   2. Apply the migration:")
            print("      make migrate")
            print("      or: docker-compose exec backend alembic upgrade head")
        else:
            print("⚠️  Migration command completed, but no new file was found.")
            print("   Check the output above for errors.")
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Error creating migration:")
        print(e.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_migration()

