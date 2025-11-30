#!/usr/bin/env python3
"""
سكريبت واحد لإصلاح مشكلة PostGIS في ملفات الـ Migration
Single script to fix PostGIS migration issue

يعمل داخل الحاوية ويحل المشكلة كاملة
Runs inside container and fixes the issue completely

Usage:
    python scripts/fix_migration.py
    or
    docker exec <container_id> python /app/scripts/fix_migration.py
"""
import sys
import re
from pathlib import Path

# PostGIS extension tables that should not be dropped
POSTGIS_TABLES = {
    'geocode_settings',
    'geocode_settings_default',
    'loader_platform',
    'loader_variables',
    'loader_lookuptables',
    'tiger',
    'tiger_data',
    'topology',
    'spatial_ref_sys',
    'geometry_columns',
    'geography_columns',
}


def find_migration_files() -> list[Path]:
    """Find all migration files"""
    # Try multiple possible paths
    possible_paths = [
        Path('/app/alembic/versions'),  # Container path
        Path('alembic/versions'),  # Current directory
        Path(__file__).parent.parent / 'alembic' / 'versions',  # Relative to script
    ]
    
    print("🔍 Searching for migration files...")
    
    for path in possible_paths:
        if path.exists():
            print(f"✅ Found versions directory: {path}")
            migration_files = list(path.glob('*.py'))
            # Filter out __init__.py and __pycache__
            migration_files = [f for f in migration_files 
                             if f.name != '__init__.py' and not f.name.startswith('__')]
            if migration_files:
                print(f"📋 Found {len(migration_files)} migration file(s)")
                return migration_files
    
    print("❌ No migration files found")
    return []


def fix_migration_file(file_path: Path) -> bool:
    """Fix a migration file by removing PostGIS table drops"""
    print(f"\n📄 Processing: {file_path.name}")
    
    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False
    
    original_content = content
    
    # Pattern to match op.drop_table('table_name')
    pattern = r'op\.drop_table\([\'"]([^\'"]+)[\'"].*?\)'
    
    def should_remove_drop(match):
        table_name = match.group(1)
        if table_name in POSTGIS_TABLES:
            print(f"  ⚠️  Removing: op.drop_table('{table_name}')")
            return ''  # Remove the line
        return match.group(0)  # Keep the line
    
    # Remove PostGIS table drops
    content = re.sub(pattern, should_remove_drop, content, flags=re.MULTILINE)
    
    # Handle multi-line drop_table statements
    multiline_pattern = r'op\.drop_table\([\'"]([^\'"]+)[\'"][^)]*\)'
    content = re.sub(multiline_pattern, should_remove_drop, content, flags=re.MULTILINE | re.DOTALL)
    
    # Clean up extra empty lines
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    if content != original_content:
        try:
            # Try to write directly
            file_path.write_text(content, encoding='utf-8')
            print(f"✅ Fixed successfully!")
            return True
        except PermissionError:
            print(f"⚠️  Permission denied (read-only mount)")
            print(f"   Trying alternative method...")
            
            # Try writing to temp file then copying
            try:
                import shutil
                import tempfile
                
                # Create temp file
                with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as tmp:
                    tmp.write(content)
                    tmp_path = Path(tmp.name)
                
                # Try to copy back (might still fail if read-only)
                shutil.copy(tmp_path, file_path)
                tmp_path.unlink()
                print(f"✅ Fixed using temp file method!")
                return True
            except Exception as e2:
                print(f"❌ Could not write file: {e2}")
                print(f"\n💡 Solution:")
                print(f"   1. The alembic directory is mounted as read-only")
                print(f"   2. Edit docker-compose.yml and remove ':ro' from:")
                print(f"      - ./alembic:/app/alembic:ro")
                print(f"   3. Change to: - ./alembic:/app/alembic")
                print(f"   4. Restart container and run this script again")
                return False
        except Exception as e:
            print(f"❌ Error writing file: {e}")
            return False
    else:
        print(f"ℹ️  No PostGIS table drops found (already fixed or not needed)")
        return False


def main():
    """Main function"""
    print("=" * 60)
    print("🔧 Fixing PostGIS Migration Issue")
    print("=" * 60)
    print()
    
    migration_files = find_migration_files()
    
    if not migration_files:
        print("\n❌ No migration files found to fix")
        print("   Expected location: /app/alembic/versions/*.py")
        sys.exit(1)
    
    print()
    fixed_count = 0
    
    for migration_file in migration_files:
        if fix_migration_file(migration_file):
            fixed_count += 1
    
    print()
    print("=" * 60)
    if fixed_count > 0:
        print(f"✅ Successfully fixed {fixed_count} migration file(s)")
        print()
        print("📋 Next step:")
        print("   Run: alembic upgrade head")
    else:
        print("ℹ️  No files needed fixing")
    print("=" * 60)


if __name__ == "__main__":
    main()

