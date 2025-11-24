"""
Router الرئيسي لـ API v1 - Main API v1 Router
"""
from fastapi import APIRouter

from app.modules.users.routes import router as users_router
from app.modules.listings.routes import router as listings_router
from app.modules.ai_trip_planner.routes import router as ai_travel_planner_router
from app.modules.files.routes import router as files_router
from app.modules.bookings.routes import router as bookings_router
from app.modules.reviews.routes import router as reviews_router
from app.modules.search.routes import router as search_router
from app.modules.messages.routes import router as messages_router

api_router = APIRouter()

# Include all routers
api_router.include_router(users_router)
api_router.include_router(listings_router)
api_router.include_router(ai_travel_planner_router)
api_router.include_router(files_router)
api_router.include_router(bookings_router)
api_router.include_router(reviews_router)
api_router.include_router(search_router)
api_router.include_router(messages_router)

