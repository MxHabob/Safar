#!/bin/bash
# Script to create initial migration for Safar Backend
# Can be run inside Docker container or from host

set -e

echo "🚀 Creating initial migration for Safar Backend..."
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if we're inside Docker container or on host
if [ -f /.dockerenv ] || [ -n "$DOCKER_CONTAINER" ]; then
    # Running inside Docker container
    echo "📋 Running inside Docker container..."
    cd /app
    
    # Check if migrations directory exists
    if [ ! -d "alembic/versions" ]; then
        echo "📁 Creating migrations directory..."
        mkdir -p alembic/versions
    fi
    
    # Check if there are existing migrations
    if [ "$(ls -A alembic/versions/*.py 2>/dev/null)" ]; then
        echo "⚠️  Warning: There are existing migrations in alembic/versions/"
        echo "   Existing migrations:"
        ls -1 alembic/versions/*.py
        echo ""
        read -p "Do you want to continue? This will create a new migration. (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Cancelled."
            exit 1
        fi
    fi
    
    # Create initial migration
    echo "📝 Creating initial migration..."
    alembic revision --autogenerate -m "initial"
    
    # Check if migration was created
    if [ "$(ls -A alembic/versions/*initial*.py 2>/dev/null)" ]; then
        echo ""
        echo "✅ Initial migration created successfully!"
        echo ""
        echo "📄 Migration file:"
        ls -1 alembic/versions/*initial*.py | tail -1
        echo ""
        echo "📋 Next steps:"
        echo "   1. Review the migration file"
        echo "   2. Apply the migration: alembic upgrade head"
    else
        echo "❌ Error: Migration file was not created"
        exit 1
    fi
else
    # Running on host - use docker-compose
    echo "📋 Running from host machine..."
    cd "$BACKEND_DIR"
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Error: docker-compose is not installed"
        exit 1
    fi
    
    # Check if services are running
    if ! docker-compose ps | grep -q "safar_backend.*Up"; then
        echo "⚠️  Backend service is not running. Starting services..."
        docker-compose up -d
        echo "⏳ Waiting for services to be ready..."
        sleep 10
    fi
    
    # Check if migrations directory exists
    if [ ! -d "alembic/versions" ]; then
        echo "📁 Creating migrations directory..."
        mkdir -p alembic/versions
    fi
    
    # Check if there are existing migrations
    if [ "$(ls -A alembic/versions/*.py 2>/dev/null)" ]; then
        echo "⚠️  Warning: There are existing migrations in alembic/versions/"
        echo "   Existing migrations:"
        ls -1 alembic/versions/*.py
        echo ""
        read -p "Do you want to continue? This will create a new migration. (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Cancelled."
            exit 1
        fi
    fi
    
    # Create initial migration
    echo "📝 Creating initial migration..."
    docker-compose exec backend alembic revision --autogenerate -m "initial"
    
    # Check if migration was created
    if [ "$(ls -A alembic/versions/*initial*.py 2>/dev/null)" ]; then
        echo ""
        echo "✅ Initial migration created successfully!"
        echo ""
        echo "📄 Migration file:"
        ls -1 alembic/versions/*initial*.py | tail -1
        echo ""
        echo "📋 Next steps:"
        echo "   1. Review the migration file: alembic/versions/*_initial.py"
        echo "   2. Apply the migration: make migrate"
        echo "      or: docker-compose exec backend alembic upgrade head"
    else
        echo "❌ Error: Migration file was not created"
        exit 1
    fi
fi
