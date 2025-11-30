#!/bin/bash
# Quick fix for migration that tries to drop PostGIS tables
# This script removes the problematic drop_table statement from the migration file
# Usage: docker exec <container_id> bash scripts/quick_fix_migration.sh

set -e

MIGRATION_DIR="/app/alembic/versions"
MIGRATION_FILE=$(find "$MIGRATION_DIR" -name "*initial*.py" -o -name "*.py" | grep -v __ | head -1)

if [ -z "$MIGRATION_FILE" ]; then
    echo "❌ No migration file found in $MIGRATION_DIR"
    exit 1
fi

echo "📄 Found migration file: $MIGRATION_FILE"
echo "🔧 Removing drop_table('geocode_settings')..."

# Use sed to remove the line that drops geocode_settings
# This handles both single-line and multi-line patterns
sed -i "/op\.drop_table(['\"]geocode_settings['\"]/d" "$MIGRATION_FILE"

# Also remove any related drop_table statements for other PostGIS tables
sed -i "/op\.drop_table(['\"]geocode_settings_default['\"]/d" "$MIGRATION_FILE"
sed -i "/op\.drop_table(['\"]loader_platform['\"]/d" "$MIGRATION_FILE"
sed -i "/op\.drop_table(['\"]loader_variables['\"]/d" "$MIGRATION_FILE"
sed -i "/op\.drop_table(['\"]loader_lookuptables['\"]/d" "$MIGRATION_FILE"

echo "✅ Migration file fixed!"
echo ""
echo "📋 Next step: Run the migration again:"
echo "   alembic upgrade head"

