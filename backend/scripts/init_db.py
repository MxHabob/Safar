"""
Database initialization script.
"""
import asyncio
from app.core.database import init_db, engine
from app.core.models import *  # Import all models


async def main():
    """Initialize the database."""
    print("Initializing database...")
    await init_db()
    print("Database initialized successfully!")


if __name__ == "__main__":
    asyncio.run(main())

