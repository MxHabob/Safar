"""
Main API v1 router.
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
from app.modules.payments.routes import router as payments_router
from app.modules.webhooks.routes import router as webhooks_router
from app.modules.recommendations.routes import router as recommendations_router
from app.modules.analytics.routes import router as analytics_router
from app.modules.promotions.routes import router as promotions_router
from app.modules.notifications.routes import router as notifications_router

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
api_router.include_router(payments_router)
api_router.include_router(webhooks_router)
api_router.include_router(recommendations_router)
api_router.include_router(analytics_router)
api_router.include_router(promotions_router)
api_router.include_router(notifications_router)

