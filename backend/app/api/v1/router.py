"""
Main API v1 router.
"""
from fastapi import APIRouter, Request
from fastapi.responses import Response

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
from app.modules.loyalty.routes import router as loyalty_router
from app.modules.listings.premium_routes import router as premium_listings_router
from app.modules.travel_guides.routes import router as travel_guides_router
from app.modules.subscriptions.routes import router as subscriptions_router
from app.modules.tenancy.routes import router as tenancy_router

api_router = APIRouter()

# Add OPTIONS handler for all API routes (CORS preflight)
# This ensures OPTIONS requests are handled before reaching route handlers
@api_router.options("/{full_path:path}")
async def options_handler(request: Request):
    """
    Handle OPTIONS preflight requests for all API routes.
    Returns 200 OK - CORSMiddleware will add appropriate CORS headers.
    """
    return Response(status_code=200)

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
api_router.include_router(loyalty_router)
api_router.include_router(premium_listings_router)
api_router.include_router(travel_guides_router)
api_router.include_router(subscriptions_router)
api_router.include_router(tenancy_router)

