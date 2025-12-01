#!/usr/bin/env python3
"""
سكريبت واحد لإصلاح مشكلة PostGIS في ملفات الـ Migration وإضافة قيد الاستبعاد
Single script to fix PostGIS migration issue and add exclusion constraint

يعمل داخل الحاوية ويحل المشكلة كاملة
Runs inside container and fixes the issue completely

This script:
1. Removes PostGIS table drops from migrations
2. Adds the exclusion constraint (excl_booking_overlap) to prevent double-booking

Usage:
    python scripts/fix_migration.py
    or
    docker exec <container_id> python /app/scripts/fix_migration.py
"""
import sys
import re
from pathlib import Path

# PostGIS extension tables that should not be dropped
# This includes tables from postgis, postgis_topology, and postgis_tiger_geocoder extensions
POSTGIS_TABLES = {
    # PostGIS core tables
    'spatial_ref_sys',
    'geometry_columns',
    'geography_columns',
    
    # PostGIS topology tables
    'topology',
    'layer',
    
    # PostGIS tiger geocoder tables
    'addr',
    'addrfeat',
    'countysub',
    'county',
    'county_lookup',
    'direction_lookup',
    'edges',
    'faces',
    'featnames',
    'geocode_settings',
    'geocode_settings_default',
    'loader_lookuptables',
    'loader_platform',
    'loader_variables',
    'pagc_gaz',
    'pagc_lex',
    'pagc_norm',
    'place',
    'place_lookup',
    'secondary_unit_lookup',
    'state',
    'state_lookup',
    'street',
    'street_type_lookup',
    'tabblock',
    'tract',
    'zcta5',
    'tiger',
    'tiger_data',
    'bg',
    'zip_state',
    'zip_lookup',
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


def add_exclusion_constraint(content: str) -> tuple[str, bool]:
    """Add exclusion constraint to migration if bookings table is created and constraint is missing"""
    # Check if this migration creates the bookings table
    has_bookings_table = ('create_table' in content and "'bookings'" in content) or \
                        ('op.create_table' in content and 'bookings' in content)
    
    # Check if constraint already exists
    has_constraint = 'excl_booking_overlap' in content
    
    if not has_bookings_table or has_constraint:
        return content, False
    
    # Find where to insert the constraint - after bookings table creation
    # Look for the end of create_table('bookings', ...) block
    create_table_pattern = r"(op\.create_table\([\'\"]bookings[\'\"].*?\)\s*\n)"
    match = re.search(create_table_pattern, content, re.DOTALL)
    
    if match:
        # Find a good insertion point - after the create_table call
        insert_pos = match.end()
        # Look for the next op. statement or end of upgrade function
        next_op = re.search(r'\n\s+op\.', content[insert_pos:])
        if next_op:
            insert_pos = insert_pos + next_op.start()
        
        # Add constraint after table creation
        constraint_code = '''
    # CRITICAL: Add exclusion constraint to prevent double-booking
    # This constraint ensures no overlapping bookings for the same listing
    # Only active bookings (CONFIRMED, PENDING, CHECKED_IN) are considered
    op.execute("""
        ALTER TABLE bookings 
        ADD CONSTRAINT excl_booking_overlap 
        EXCLUDE USING gist (
            listing_id WITH =,
            tstzrange(check_in, check_out) WITH &&
        ) WHERE (status IN ('CONFIRMED', 'PENDING', 'CHECKED_IN'))
    """)
'''
        content = content[:insert_pos] + constraint_code + content[insert_pos:]
        return content, True
    
    return content, False


def fix_migration_file(file_path: Path) -> bool:
    """Fix a migration file by removing PostGIS table drops and adding exclusion constraint"""
    print(f"\n📄 Processing: {file_path.name}")
    
    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False
    
    original_content = content
    modified = False
    
    # Pattern to match op.drop_table('table_name') - handles both single and double quotes
    # Also handles multi-line statements and schema-qualified tables
    def should_remove_drop(match):
        # Extract table name from the match
        full_match = match.group(0)
        # Try to extract table name from various patterns
        table_match = re.search(r'[\'"]([^\'"]+)[\'"]', full_match)
        if table_match:
            table_full = table_match.group(1)
            # Handle schema-qualified tables (e.g., 'schema.table' or just 'table')
            if '.' in table_full:
                table_name = table_full.split('.')[-1]  # Get just the table name
            else:
                table_name = table_full
            
            if table_name in POSTGIS_TABLES:
                print(f"  ⚠️  Removing: op.drop_table('{table_full}')")
                return ''  # Remove the entire drop_table call
        return match.group(0)  # Keep the line
    
    # Single pattern that handles all cases: single-line, multi-line, with/without schema
    drop_table_pattern = r'op\.drop_table\([\'"]([^\'"]+)[\'"][^)]*\)'

    # Track whether we actually removed any drop_table calls
    drops_removed = False

    def _wrapper(match):
        nonlocal drops_removed
        result = should_remove_drop(match)
        if result == '':
            drops_removed = True
        return result

    content = re.sub(drop_table_pattern, _wrapper, content, flags=re.MULTILINE | re.DOTALL)

    if drops_removed:
        modified = True
    
    # Add exclusion constraint if needed
    content, constraint_added = add_exclusion_constraint(content)
    if constraint_added:
        print(f"  ✅ Added exclusion constraint 'excl_booking_overlap'")
        modified = True
    
    # Clean up extra empty lines
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    if modified:
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
        print(f"ℹ️  No fixes needed (already fixed or not needed)")
        return False


def main():
    """Main function"""
    print("=" * 60)
    print("🔧 Fixing Migration Issues")
    print("=" * 60)
    print("   - Removing PostGIS table drops")
    print("   - Adding exclusion constraint for bookings")
    print("=" * 60)
    print()
    
    migration_files = find_migration_files()
    
    if not migration_files:
        print("\nℹ️  No migration files found to fix")
        print("   Expected location: /app/alembic/versions/*.py")
        print()
        print("💡 This is normal if migrations haven't been created yet.")
        print("   To create migrations, run:")
        print("   docker exec <container_id> alembic revision --autogenerate -m \"initial\"")
        print("   or use: ./scripts/create_initial_migration_auto.sh")
        print()
        print("=" * 60)
        print("✅ No migrations to fix (this is OK)")
        print("=" * 60)
        sys.exit(0)  # Exit successfully - no migrations means nothing to fix
    
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

