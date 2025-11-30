#!/usr/bin/env python3
"""
Script to fix migration that tries to drop PostGIS extension tables
This removes the problematic drop_table statements for PostGIS tables

Usage:
    python scripts/fix_migration_postgis.py
    or
    docker exec <container_id> python scripts/fix_migration_postgis.py
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


def fix_migration_file(file_path: Path) -> bool:
    """Fix a migration file by removing PostGIS table drops"""
    if not file_path.exists():
        print(f"❌ Migration file not found: {file_path}")
        return False
    
    print(f"📄 Reading migration file: {file_path}")
    content = file_path.read_text(encoding='utf-8')
    original_content = content
    
    # Pattern to match op.drop_table('table_name')
    # This will match:
    # - op.drop_table('geocode_settings')
    # - op.drop_table("geocode_settings")
    # - op.drop_table('geocode_settings', ...)
    pattern = r'op\.drop_table\([\'"]([^\'"]+)[\'"].*?\)'
    
    def should_remove_drop(match):
        table_name = match.group(1)
        if table_name in POSTGIS_TABLES:
            print(f"  ⚠️  Removing drop_table for PostGIS table: {table_name}")
            return ''  # Remove the line
        return match.group(0)  # Keep the line
    
    # Remove PostGIS table drops
    content = re.sub(pattern, should_remove_drop, content, flags=re.MULTILINE)
    
    # Also handle multi-line drop_table statements
    # Pattern for multi-line: op.drop_table('table_name', ...)
    multiline_pattern = r'op\.drop_table\([\'"]([^\'"]+)[\'"][^)]*\)'
    content = re.sub(multiline_pattern, should_remove_drop, content, flags=re.MULTILINE | re.DOTALL)
    
    # Remove empty lines that might have been left behind (more than 2 consecutive newlines)
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    if content != original_content:
        file_path.write_text(content, encoding='utf-8')
        print(f"✅ Fixed migration file: {file_path}")
        return True
    else:
        print(f"ℹ️  No changes needed in: {file_path}")
        return False


def find_migration_files() -> list[Path]:
    """Find all migration files in alembic/versions"""
    # Try multiple possible paths
    possible_paths = [
        Path(__file__).parent.parent / 'alembic' / 'versions',  # Relative to script
        Path('/app/alembic/versions'),  # Absolute path in container
        Path('alembic/versions'),  # Current directory
    ]
    
    versions_dir = None
    for path in possible_paths:
        if path.exists():
            versions_dir = path
            break
    
    if not versions_dir:
        print(f"❌ Versions directory not found. Tried:")
        for path in possible_paths:
            print(f"   - {path}")
        return []
    
    migration_files = list(versions_dir.glob('*.py'))
    # Filter out __init__.py and __pycache__
    migration_files = [f for f in migration_files if f.name != '__init__.py' and not f.name.startswith('__')]
    return migration_files


def main():
    """Main function"""
    print("🔧 Fixing migration files to exclude PostGIS extension tables...")
    print()
    
    migration_files = find_migration_files()
    
    if not migration_files:
        print("❌ No migration files found")
        print("   Expected location: alembic/versions/*.py")
        sys.exit(1)
    
    print(f"📋 Found {len(migration_files)} migration file(s)")
    print()
    
    fixed_count = 0
    for migration_file in migration_files:
        if fix_migration_file(migration_file):
            fixed_count += 1
        print()
    
    if fixed_count > 0:
        print(f"✅ Fixed {fixed_count} migration file(s)")
        print()
        print("📋 Next steps:")
        print("   1. Review the fixed migration file(s)")
        print("   2. Run the migration: alembic upgrade head")
    else:
        print("ℹ️  No migration files needed fixing")
    
    print()


if __name__ == "__main__":
    main()

