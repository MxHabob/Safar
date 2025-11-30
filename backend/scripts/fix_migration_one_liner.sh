#!/bin/bash
# One-liner to fix migration - can be run directly
# Usage: docker exec <container_id> bash -c 'find /app/alembic/versions -name "*.py" ! -name "__*" | head -1 | xargs sed -i "/op\.drop_table([\"'\''\"]geocode_settings[\"'\''\"]/d"'

# Alternative: Run this entire script content as a one-liner
find /app/alembic/versions -name "*initial*.py" -o -name "*.py" | grep -v __ | head -1 | while read file; do
  if [ -n "$file" ]; then
    echo "📄 Fixing: $file"
    sed -i "/op\.drop_table(['\"]geocode_settings['\"]/d" "$file"
    sed -i "/op\.drop_table(['\"]geocode_settings_default['\"]/d" "$file"
    sed -i "/op\.drop_table(['\"]loader_platform['\"]/d" "$file"
    sed -i "/op\.drop_table(['\"]loader_variables['\"]/d" "$file"
    sed -i "/op\.drop_table(['\"]loader_lookuptables['\"]/d" "$file"
    echo "✅ Fixed!"
  fi
done

