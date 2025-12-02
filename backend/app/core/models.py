"""
Import all models here to ensure they are registered with Alembic.
"""
# Users - Enhanced
from app.modules.users.models import (
    User, Agency, UserVerification,
    Account, UserDevice, UserPasskey, TwoFactorChallenge,
    HostProfile, CoHost, TaxDocument
)

# Listings - Enhanced with PostGIS
from app.modules.listings.models import (
    Listing, ListingPhoto, ListingImage, ListingLocation,
    Amenity, ListingAmenity, ListingRule, ListingAvailability,
    PricingRule, PricingModel, PricingModelRule,
    Calendar, AvailabilityWindow, BlockedDate, SeasonalOverride,
    PriceCalendar, ListingDraft
)

# Bookings - Enhanced
from app.modules.bookings.models import (
    Booking, BookingTimelineEvent,
    Payment, PaymentMethod,
    Payout, PayoutBatch
)

# Reviews - Enhanced
from app.modules.reviews.models import (
    Review, ReviewHelpful, ReviewResponse
)

# Messages - Enhanced with Conversations
from app.modules.messages.models import (
    Conversation, Message, MessageAutomation
)

# Promotions - Enhanced
from app.modules.promotions.models import (
    Coupon, Promotion, CounterOffer, PromotionRedemption
)

# AI Trip Planner
from app.modules.ai_trip_planner.models import (
    TravelPlan, TravelPlanBooking
)

# Notifications
from app.modules.notifications.models import Notification

# Wishlist
from app.modules.wishlist.models import Wishlist

# Files
from app.modules.files.models import File

# Loyalty
from app.modules.loyalty.models import (
    LoyaltyProgram, LoyaltyLedger
)

# Disputes
from app.modules.disputes.models import (
    Dispute, DisputeEvidence
)

# Analytics
from app.modules.analytics.models import (
    AnalyticsEvent, AuditLog, SearchSnapshot
)

# Webhooks
from app.modules.webhooks.models import WebhookEvent

# Travel Guides
from app.modules.travel_guides.models import (
    TravelGuide, UserStory, TravelGuideBookmark, TravelGuideLike,
    UserStoryLike, UserStoryComment
)

# Subscriptions
from app.modules.subscriptions.models import (
    SubscriptionPlan, Subscription, SubscriptionInvoice
)

# Tenancy
from app.modules.tenancy.models import (
    Tenant, TenantDomain, TenantConfig
)

# Base
from app.shared.base import BaseModel, StringIDBaseModel

__all__ = [
    # Base
    "BaseModel",
    "StringIDBaseModel",
    
    # Users
    "User",
    "Agency",
    "UserVerification",
    "Account",
    "UserDevice",
    "UserPasskey",
    "TwoFactorChallenge",
    "HostProfile",
    "CoHost",
    "TaxDocument",
    
    # Listings (renamed from Properties)
    "Listing",
    "ListingPhoto",
    "ListingImage",
    "ListingLocation",
    "Amenity",
    "ListingAmenity",
    "ListingRule",
    "ListingAvailability",
    "PricingRule",
    "PricingModel",
    "PricingModelRule",
    "Calendar",
    "AvailabilityWindow",
    "BlockedDate",
    "SeasonalOverride",
    "PriceCalendar",
    "ListingDraft",
    
    # Bookings
    "Booking",
    "BookingTimelineEvent",
    "Payment",
    "PaymentMethod",
    "Payout",
    "PayoutBatch",
    
    # Reviews
    "Review",
    "ReviewHelpful",
    "ReviewResponse",
    
    # Messages
    "Conversation",
    "Message",
    "MessageAutomation",
    
    # Promotions
    "Coupon",
    "Promotion",
    "CounterOffer",
    "PromotionRedemption",
    
    # AI Trip Planner
    "TravelPlan",
    "TravelPlanBooking",
    
    # Notifications
    "Notification",
    
    # Wishlist
    "Wishlist",
    
    # Files
    "File",
    
    # Loyalty
    "LoyaltyProgram",
    "LoyaltyLedger",
    
    # Disputes
    "Dispute",
    "DisputeEvidence",
    
    # Analytics
    "AnalyticsEvent",
    "AuditLog",
    "SearchSnapshot",
    
    # Webhooks
    "WebhookEvent",
    
    # Travel Guides
    "TravelGuide",
    "UserStory",
    "TravelGuideBookmark",
    "TravelGuideLike",
    "UserStoryLike",
    "UserStoryComment",
    
    # Subscriptions
    "SubscriptionPlan",
    "Subscription",
    "SubscriptionInvoice",
    
    # Tenancy
    "Tenant",
    "TenantDomain",
    "TenantConfig",
]
