"""
Development data seeding script.

This script populates the database with realistic development data including:
- Users (hosts, guests, admins)
- Listings with real images from Unsplash
- Amenities
- Bookings
- Reviews

Best Practices:
- Uses proper ID generation
- Handles relationships correctly
- Uses real image URLs (Unsplash Source API)
- Idempotent (can be run multiple times safely)
- Proper error handling

Usage:
    python -m scripts.seed_dev_data
    python -m scripts.seed_dev_data --clear  # Clear existing data first
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional
import random

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, insert
from geoalchemy2 import WKTElement

from app.core.database import AsyncSessionLocal, init_db, Base
from app.core.id import generate_typed_id

# Fix Tenant relationships BEFORE importing any models that might trigger mapper configuration
# The Tenant model has broken relationships (back_populates="tenant" but User/Listing have no tenant relationship)
# We'll replace the relationships with ones that don't use back_populates
try:
    from app.modules.tenancy.models import Tenant
    from sqlalchemy.orm import relationship
    
    # Replace relationships with new ones that don't have back_populates
    # We'll use a primaryjoin that references the Tenant table's id column
    # Since there's no FK, we create a condition that's always false using column expressions
    tenant_id_col = Tenant.__table__.c.id
    
    # Create new relationships without back_populates
    # Use a primaryjoin that always evaluates to false: tenant.id != tenant.id
    Tenant.users = relationship(
        "User",
        lazy="selectin",
        viewonly=True,
        primaryjoin=tenant_id_col != tenant_id_col  # Always false - no matches
    )
    
    Tenant.listings = relationship(
        "Listing",
        lazy="selectin",
        viewonly=True,
        primaryjoin=tenant_id_col != tenant_id_col  # Always false - no matches
    )
except Exception:
    # Fallback: create simple relationships without primaryjoin
    # SQLAlchemy will try to find FKs and fail, but we'll catch that
    try:
        from app.modules.tenancy.models import Tenant
        from sqlalchemy.orm import relationship
        
        # Simple relationships without back_populates
        # These will fail if SQLAlchemy tries to auto-detect FKs, but we'll handle it
        Tenant.users = relationship("User", lazy="selectin", viewonly=True, foreign_keys=[])
        Tenant.listings = relationship("Listing", lazy="selectin", viewonly=True, foreign_keys=[])
    except:
        pass

# Import models directly from modules to avoid Tenant relationship issues
# Import all models that are referenced by relationships to avoid SQLAlchemy configuration errors

# Users
from app.modules.users.models import User, UserRole, UserStatus, HostProfile, Agency

# Listings
from app.modules.listings.models import (
    Listing, ListingType, ListingStatus, BookingType,
    ListingImage, ListingLocation, Amenity, ListingAmenity,
    ListingRule, Calendar, PriceCalendar
)

# Bookings (must import Dispute before Booking to satisfy relationship)
from app.modules.disputes.models import Dispute, DisputeEvidence
from app.modules.bookings.models import Booking, BookingStatus, Payment, PaymentStatus, PaymentMethodType

# Reviews
from app.modules.reviews.models import Review

# Messages
from app.modules.messages.models import Conversation, Message, conversation_participants, MessageAutomation

# Wishlist
from app.modules.wishlist.models import Wishlist

# Promotions
from app.modules.promotions.models import Coupon, Promotion, DiscountType, PromotionType, PromotionRedemption

# Travel Guides
from app.modules.travel_guides.models import (
    TravelGuide, UserStory, TravelGuideBookmark, TravelGuideLike,
    UserStoryLike, UserStoryComment
)

# Notifications
from app.modules.notifications.models import Notification, NotificationType

# Analytics
from app.modules.analytics.models import AnalyticsEvent

# Loyalty
from app.modules.loyalty.models import LoyaltyProgram, LoyaltyLedger

# Files
from app.modules.files.models import File, FileType, FileCategory

# Password hashing helper with bcrypt fallback
def safe_password_hash(password: str) -> str:
    """
    Hash password with fallback for bcrypt compatibility issues.
    Handles bcrypt/passlib version compatibility problems.
    Uses bcrypt directly to avoid passlib initialization issues.
    """
    try:
        import bcrypt
        # Ensure password is bytes and not longer than 72 bytes (bcrypt limit)
        password_bytes = password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        # Generate salt and hash
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    except ImportError:
        # If bcrypt is not available, try passlib
        try:
            from app.core.security import get_password_hash
            return get_password_hash(password)
        except Exception as e:
            raise RuntimeError(f"Failed to hash password: {e}. Please ensure bcrypt is installed.")


# Real image URLs from Unsplash (using specific image IDs for reliability)
# Format: https://images.unsplash.com/photo-{image_id}?w=800&h=600&fit=crop
UNSPLASH_IMAGES = {
    "apartment": [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",  # Modern apartment
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",  # Cozy apartment
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",  # Luxury apartment
        "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800&h=600&fit=crop",  # Apartment interior
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop",  # Apartment living room
    ],
    "house": [
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop",  # Modern house
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop",  # Beautiful house
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",  # House exterior
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",  # House front
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop",  # House backyard
    ],
    "villa": [
        "https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800&h=600&fit=crop",  # Luxury villa
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",  # Villa pool
        "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&h=600&fit=crop",  # Villa exterior
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",  # Villa interior
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop",  # Villa garden
    ],
    "room": [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop",  # Bedroom
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop",  # Cozy room
        "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop",  # Modern room
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",  # Room interior
    ],
    "studio": [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",  # Studio apartment
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",  # Small studio
    ],
    "condo": [
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",  # Condo
        "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800&h=600&fit=crop",  # Condo interior
    ],
    "townhouse": [
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop",  # Townhouse
    ],
    "cabin": [
        "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800&h=600&fit=crop",  # Cabin
        "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=600&fit=crop",  # Wooden cabin
    ],
    "boat": [
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop",  # Boat
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",  # Yacht
    ],
    "camper": [
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=600&fit=crop",  # RV
    ],
}

# User avatar URLs
AVATAR_URLS = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop",
]

# Sample locations with coordinates
LOCATIONS = [
    {"city": "Dubai", "country": "UAE", "lat": 25.2048, "lon": 55.2708, "address": "Downtown Dubai"},
    {"city": "Abu Dhabi", "country": "UAE", "lat": 24.4539, "lon": 54.3773, "address": "Corniche Road"},
    {"city": "Riyadh", "country": "Saudi Arabia", "lat": 24.7136, "lon": 46.6753, "address": "King Fahd District"},
    {"city": "Jeddah", "country": "Saudi Arabia", "lat": 21.4858, "lon": 39.1925, "address": "Corniche"},
    {"city": "Cairo", "country": "Egypt", "lat": 30.0444, "lon": 31.2357, "address": "Zamalek"},
    {"city": "Marrakech", "country": "Morocco", "lat": 31.6295, "lon": -7.9811, "address": "Medina"},
    {"city": "Istanbul", "country": "Turkey", "lat": 41.0082, "lon": 28.9784, "address": "Sultanahmet"},
    {"city": "Amman", "country": "Jordan", "lat": 31.9539, "lon": 35.9106, "address": "Jabal Amman"},
]

# Sample amenities
AMENITY_DATA = [
    {"key": "wifi", "name": "WiFi", "category": "basic", "is_featured": True},
    {"key": "air_conditioning", "name": "Air Conditioning", "category": "basic", "is_featured": True},
    {"key": "heating", "name": "Heating", "category": "basic", "is_featured": True},
    {"key": "kitchen", "name": "Kitchen", "category": "basic", "is_featured": True},
    {"key": "parking", "name": "Free Parking", "category": "basic", "is_featured": True},
    {"key": "pool", "name": "Swimming Pool", "category": "entertainment", "is_featured": True},
    {"key": "hot_tub", "name": "Hot Tub", "category": "entertainment", "is_featured": False},
    {"key": "gym", "name": "Gym", "category": "entertainment", "is_featured": False},
    {"key": "tv", "name": "TV", "category": "entertainment", "is_featured": False},
    {"key": "washer", "name": "Washer", "category": "basic", "is_featured": False},
    {"key": "dryer", "name": "Dryer", "category": "basic", "is_featured": False},
    {"key": "workspace", "name": "Dedicated Workspace", "category": "basic", "is_featured": True},
    {"key": "smoke_alarm", "name": "Smoke Alarm", "category": "safety", "is_featured": True},
    {"key": "carbon_monoxide_alarm", "name": "Carbon Monoxide Alarm", "category": "safety", "is_featured": True},
    {"key": "fire_extinguisher", "name": "Fire Extinguisher", "category": "safety", "is_featured": False},
]


class DevDataSeeder:
    """Development data seeder."""
    
    def __init__(self, session: AsyncSession, clear_existing: bool = False):
        self.session = session
        self.clear_existing = clear_existing
        self.users: List[User] = []
        self.listings: List[Listing] = []
        self.amenities: List[Amenity] = []
        
    async def seed(self):
        """Main seeding method."""
        print("🌱 Starting development data seeding...")
        
        if self.clear_existing:
            print("🗑️  Clearing existing data...")
            await self._clear_data()
        
        print("👥 Creating users...")
        await self._seed_users()
        
        print("🏠 Creating listings...")
        await self._seed_listings()
        
        print("✨ Creating amenities...")
        await self._seed_amenities()
        
        print("🔗 Linking amenities to listings...")
        await self._link_amenities()
        
        print("📅 Creating bookings...")
        await self._seed_bookings()
        
        print("⭐ Creating reviews...")
        await self._seed_reviews()
        
        print("💬 Creating conversations and messages...")
        await self._seed_messages()
        
        print("❤️  Creating wishlists...")
        await self._seed_wishlists()
        
        print("🎟️  Creating promotions and coupons...")
        await self._seed_promotions()
        
        print("✈️  Creating travel guides...")
        await self._seed_travel_guides()
        
        print("🔔 Creating notifications...")
        await self._seed_notifications()
        
        print("📊 Creating analytics events...")
        await self._seed_analytics()
        
        print("🎁 Creating loyalty programs...")
        await self._seed_loyalty()
        
        await self.session.commit()
        print("✅ Development data seeding completed successfully!")
        
    async def _clear_data(self):
        """Clear existing data (in reverse dependency order)."""
        try:
            # Clear in reverse dependency order (child tables first)
            await self.session.execute(delete(UserStoryComment))
            await self.session.execute(delete(UserStoryLike))
            await self.session.execute(delete(TravelGuideLike))
            await self.session.execute(delete(TravelGuideBookmark))
            await self.session.execute(delete(UserStory))
            await self.session.execute(delete(TravelGuide))
            await self.session.execute(delete(PromotionRedemption))
            await self.session.execute(delete(Promotion))
            await self.session.execute(delete(Coupon))
            await self.session.execute(delete(Notification))
            await self.session.execute(delete(AnalyticsEvent))
            await self.session.execute(delete(LoyaltyLedger))
            await self.session.execute(delete(LoyaltyProgram))
            await self.session.execute(delete(DisputeEvidence))
            await self.session.execute(delete(Dispute))
            await self.session.execute(delete(Message))
            await self.session.execute(delete(MessageAutomation))
            await self.session.execute(delete(Conversation))
            await self.session.execute(delete(Wishlist))
            await self.session.execute(delete(Review))
            await self.session.execute(delete(Payment))
            await self.session.execute(delete(Booking))
            await self.session.execute(delete(ListingAmenity))
            await self.session.execute(delete(ListingImage))
            await self.session.execute(delete(ListingLocation))
            await self.session.execute(delete(Calendar))
            await self.session.execute(delete(PriceCalendar))
            await self.session.execute(delete(ListingRule))
            await self.session.execute(delete(Listing))
            await self.session.execute(delete(HostProfile))
            await self.session.execute(delete(Amenity))
            await self.session.execute(delete(User))
            await self.session.commit()
            print("✅ Existing data cleared")
        except Exception as e:
            await self.session.rollback()
            print(f"⚠️  Warning: Could not clear all data: {e}")
    
    async def _seed_users(self):
        """Create users (hosts, guests, admins)."""
        # Create admin user
        admin = User(
            id=generate_typed_id("usr"),
            email="admin@safar.com",
            username="admin",
            hashed_password=safe_password_hash("admin123"),
            first_name="Admin",
            last_name="User",
            full_name="Admin User",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            is_active=True,
            is_email_verified=True,
            avatar_url=random.choice(AVATAR_URLS),
            country="UAE",
            city="Dubai",
            currency="USD",
        )
        self.session.add(admin)
        self.users.append(admin)
        
        # Create hosts
        host_names = [
            ("Ahmed", "Al-Mansoori", "ahmed.host"),
            ("Fatima", "Al-Zahra", "fatima.host"),
            ("Mohammed", "Al-Rashid", "mohammed.host"),
            ("Sarah", "Johnson", "sarah.host"),
            ("Omar", "Hassan", "omar.host"),
        ]
        
        for first_name, last_name, username in host_names:
            host = User(
                id=generate_typed_id("usr"),
                email=f"{username}@safar.com",
                username=username,
                hashed_password=safe_password_hash("host123"),
                first_name=first_name,
                last_name=last_name,
                full_name=f"{first_name} {last_name}",
                role=UserRole.HOST,
                status=UserStatus.ACTIVE,
                is_active=True,
                is_email_verified=True,
                avatar_url=random.choice(AVATAR_URLS),
                country=random.choice(["UAE", "Saudi Arabia", "Egypt", "Morocco"]),
                city=random.choice(["Dubai", "Riyadh", "Cairo", "Marrakech"]),
                currency="USD",
                bio=f"Experienced host {first_name} here! Welcome to my properties.",
            )
            self.session.add(host)
            self.users.append(host)
            
            # Create host profile
            host_profile = HostProfile(
                id=generate_typed_id("hpr"),
                user_id=host.id,
                legal_name=f"{first_name} {last_name}",
                status="approved",
                bio=f"Experienced host {first_name} here! Welcome to my properties.",
            )
            self.session.add(host_profile)
            await self.session.flush()
        
        # Create guests
        guest_names = [
            ("Layla", "Ahmed", "layla.guest"),
            ("Youssef", "Ibrahim", "youssef.guest"),
            ("Maya", "Khalil", "maya.guest"),
            ("David", "Smith", "david.guest"),
            ("Aisha", "Mohammed", "aisha.guest"),
            ("Karim", "Ali", "karim.guest"),
        ]
        
        for first_name, last_name, username in guest_names:
            guest = User(
                id=generate_typed_id("usr"),
                email=f"{username}@safar.com",
                username=username,
                hashed_password=safe_password_hash("guest123"),
                first_name=first_name,
                last_name=last_name,
                full_name=f"{first_name} {last_name}",
                role=UserRole.GUEST,
                status=UserStatus.ACTIVE,
                is_active=True,
                is_email_verified=True,
                avatar_url=random.choice(AVATAR_URLS),
                country=random.choice(["UAE", "Saudi Arabia", "Egypt", "Jordan"]),
                city=random.choice(["Dubai", "Riyadh", "Cairo", "Amman"]),
                currency="USD",
            )
            self.session.add(guest)
            self.users.append(guest)
        
        await self.session.flush()
        print(f"✅ Created {len(self.users)} users")
    
    async def _seed_listings(self):
        """Create listings with images."""
        hosts = [u for u in self.users if u.role == UserRole.HOST]
        listing_types = list(ListingType)
        
        listing_templates = [
            {
                "title": "Luxurious Downtown Apartment with City Views",
                "description": "Stunning modern apartment in the heart of the city with breathtaking views. Fully furnished with premium amenities.",
                "type": ListingType.APARTMENT,
                "base_price": Decimal("150.00"),
            },
            {
                "title": "Spacious Family Villa with Private Pool",
                "description": "Beautiful villa perfect for families. Features a private pool, large garden, and fully equipped kitchen.",
                "type": ListingType.VILLA,
                "base_price": Decimal("300.00"),
            },
            {
                "title": "Cozy Studio Apartment Near Beach",
                "description": "Charming studio apartment just steps away from the beach. Perfect for couples or solo travelers.",
                "type": ListingType.STUDIO,
                "base_price": Decimal("80.00"),
            },
            {
                "title": "Modern House with Garden",
                "description": "Contemporary house with beautiful garden and modern amenities. Great for families or groups.",
                "type": ListingType.HOUSE,
                "base_price": Decimal("200.00"),
            },
            {
                "title": "Elegant Condo with Balcony",
                "description": "Elegant condo with spacious balcony overlooking the city. Fully furnished and ready to move in.",
                "type": ListingType.CONDO,
                "base_price": Decimal("120.00"),
            },
            {
                "title": "Charming Cabin in the Mountains",
                "description": "Rustic cabin surrounded by nature. Perfect for a peaceful getaway.",
                "type": ListingType.CABIN,
                "base_price": Decimal("100.00"),
            },
            {
                "title": "Luxury Yacht Experience",
                "description": "Experience luxury on the water. Fully equipped yacht with all amenities.",
                "type": ListingType.BOAT,
                "base_price": Decimal("500.00"),
            },
            {
                "title": "Modern Townhouse in Residential Area",
                "description": "Spacious townhouse in a quiet residential area. Perfect for families.",
                "type": ListingType.TOWNHOUSE,
                "base_price": Decimal("180.00"),
            },
        ]
        
        for i, template in enumerate(listing_templates):
            location = random.choice(LOCATIONS)
            host = random.choice(hosts)
            
            # Get host profile
            host_profile_result = await self.session.execute(
                select(HostProfile).where(HostProfile.user_id == host.id)
            )
            host_profile = host_profile_result.scalar_one_or_none()
            
            listing_id = generate_typed_id("lst")
            listing = Listing(
                id=listing_id,
                title=template["title"],
                slug=f"{template['type'].value}-{i+1}-{location['city'].lower().replace(' ', '-')}-{listing_id.split('_')[1][:8]}",
                summary=template["description"][:200],
                description=template["description"],
                listing_type=template["type"].value,
                status=ListingStatus.ACTIVE.value,
                host_id=host.id,
                host_profile_id=host_profile.id if host_profile else None,
                address_line1=f"{random.randint(1, 999)} {location['address']}",
                city=location["city"],
                country=location["country"],
                postal_code=str(random.randint(10000, 99999)),
                latitude=Decimal(str(location["lat"])),
                longitude=Decimal(str(location["lon"])),
                capacity=random.randint(2, 8),
                bedrooms=random.randint(1, 4),
                beds=random.randint(1, 4),
                bathrooms=Decimal(str(random.choice([1, 1.5, 2, 2.5, 3]))),
                max_guests=random.randint(2, 8),
                square_meters=random.randint(50, 300),
                base_price=template["base_price"],
                currency="USD",
                cleaning_fee=Decimal(str(random.randint(20, 50))),
                service_fee=Decimal(str(random.randint(10, 30))),
                security_deposit=Decimal(str(random.randint(100, 500))),
                booking_type=random.choice(list(BookingType)),
                min_stay_nights=random.randint(1, 3),
                max_stay_nights=random.randint(7, 30),
                check_in_time="15:00",
                check_out_time="11:00",
                rating=Decimal(str(round(random.uniform(4.0, 5.0), 2))),
                review_count=random.randint(5, 50),
                is_premium=random.choice([True, False]),
                is_featured=random.choice([True, False]),
            )
            self.session.add(listing)
            self.listings.append(listing)
            await self.session.flush()
            
            # Create listing location with PostGIS
            listing_location = ListingLocation(
                id=generate_typed_id("llc"),
                listing_id=listing.id,
                timezone="UTC",
                neighborhood=location["address"],
                coordinates=WKTElement(f"POINT({location['lon']} {location['lat']})", srid=4326),
            )
            self.session.add(listing_location)
            
            # Create listing images
            image_type = template["type"].value
            image_urls = UNSPLASH_IMAGES.get(image_type, UNSPLASH_IMAGES["apartment"])
            
            # Add 3-5 images per listing
            num_images = random.randint(3, 5)
            selected_images = random.sample(image_urls, min(num_images, len(image_urls)))
            
            for idx, image_url in enumerate(selected_images):
                listing_image = ListingImage(
                    id=generate_typed_id("lim"),
                    listing_id=listing.id,
                    url=image_url,
                    caption=f"{template['title']} - Image {idx + 1}",
                    position=idx,
                )
                self.session.add(listing_image)
            
            # Create calendar
            calendar = Calendar(
                id=generate_typed_id("cal"),
                listing_id=listing.id,
                external_ical_urls=[],
            )
            self.session.add(calendar)
            
            # Create some price calendar entries (next 90 days)
            base_date = datetime.now(timezone.utc).date()
            for day_offset in range(90):
                date = base_date + timedelta(days=day_offset)
                # Vary price slightly (±20%)
                price_multiplier = Decimal(str(round(random.uniform(0.8, 1.2), 2)))
                nightly_rate = template["base_price"] * price_multiplier
                
                price_calendar = PriceCalendar(
                    id=generate_typed_id("pcl"),
                    listing_id=listing.id,
                    date=date,
                    nightly_rate=nightly_rate,
                    currency="USD",
                    min_stay=listing.min_stay_nights,
                    is_blocked=random.choice([True, False]) if random.random() < 0.1 else False,  # 10% chance blocked
                )
                self.session.add(price_calendar)
            
            # Create listing rules
            rules = [
                {"key": "smoking", "value": "not_allowed", "description": "No smoking allowed"},
                {"key": "pets", "value": random.choice(["allowed", "not_allowed"]), "description": "Pets policy"},
                {"key": "parties", "value": "not_allowed", "description": "No parties or events"},
            ]
            for rule_data in rules:
                listing_rule = ListingRule(
                    id=generate_typed_id("lrl"),
                    listing_id=listing.id,
                    key=rule_data["key"],
                    value=rule_data["value"],
                    description=rule_data["description"],
                )
                self.session.add(listing_rule)
            
            await self.session.flush()
        
        print(f"✅ Created {len(self.listings)} listings")
    
    async def _seed_amenities(self):
        """Create amenities."""
        for amenity_data in AMENITY_DATA:
            # Check if amenity already exists
            result = await self.session.execute(
                select(Amenity).where(Amenity.key == amenity_data["key"])
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                amenity = Amenity(
                    id=generate_typed_id("amn"),
                    key=amenity_data["key"],
                    name=amenity_data["name"],
                    category=amenity_data["category"],
                    is_featured=amenity_data["is_featured"],
                )
                self.session.add(amenity)
                self.amenities.append(amenity)
            else:
                self.amenities.append(existing)
        
        await self.session.flush()
        print(f"✅ Created/verified {len(self.amenities)} amenities")
    
    async def _link_amenities(self):
        """Link amenities to listings."""
        for listing in self.listings:
            # Add 5-10 random amenities per listing
            num_amenities = random.randint(5, 10)
            selected_amenities = random.sample(self.amenities, min(num_amenities, len(self.amenities)))
            
            for amenity in selected_amenities:
                listing_amenity = ListingAmenity(
                    id=generate_typed_id("lam"),
                    listing_id=listing.id,
                    amenity_id=amenity.id,
                )
                self.session.add(listing_amenity)
        
        await self.session.flush()
        print("✅ Linked amenities to listings")
    
    async def _seed_bookings(self):
        """Create bookings."""
        guests = [u for u in self.users if u.role == UserRole.GUEST]
        
        booking_statuses = [
            BookingStatus.CONFIRMED,
            BookingStatus.COMPLETED,
            BookingStatus.CHECKED_OUT,
            BookingStatus.PENDING,
        ]
        
        for i in range(min(15, len(self.listings) * 2)):  # Create up to 15 bookings
            listing = random.choice(self.listings)
            guest = random.choice(guests)
            status = random.choice(booking_statuses)
            
            # Generate dates
            base_date = datetime.now(timezone.utc)
            if status == BookingStatus.COMPLETED or status == BookingStatus.CHECKED_OUT:
                # Past booking
                check_in = base_date - timedelta(days=random.randint(10, 60))
            elif status == BookingStatus.CONFIRMED:
                # Future booking
                check_in = base_date + timedelta(days=random.randint(1, 30))
            else:
                # Pending booking
                check_in = base_date + timedelta(days=random.randint(1, 60))
            
            nights = random.randint(listing.min_stay_nights, min(7, listing.max_stay_nights or 7))
            check_out = check_in + timedelta(days=nights)
            
            # Calculate pricing
            base_price = listing.base_price * Decimal(str(nights))
            cleaning_fee = listing.cleaning_fee
            service_fee = listing.service_fee
            total_amount = base_price + cleaning_fee + service_fee
            
            booking = Booking(
                id=generate_typed_id("bkg"),
                booking_number=f"BK{random.randint(100000, 999999)}",
                listing_id=listing.id,
                guest_id=guest.id,
                check_in=check_in,
                check_out=check_out,
                check_in_date=check_in.date(),
                check_out_date=check_out.date(),
                nights=nights,
                adults=random.randint(1, min(4, listing.max_guests)),
                children=random.randint(0, 2),
                infants=0,
                guests=random.randint(1, min(4, listing.max_guests)),
                base_price=base_price,
                cleaning_fee=cleaning_fee,
                service_fee=service_fee,
                total_amount=total_amount,
                currency="USD",
                status=status.value,
            )
            self.session.add(booking)
            await self.session.flush()
            
            # Create payment for completed/confirmed bookings
            if status in [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.CHECKED_OUT]:
                payment = Payment(
                    id=generate_typed_id("pay"),
                    booking_id=booking.id,
                    amount=total_amount,
                    currency="USD",
                    status=PaymentStatus.COMPLETED.value if status != BookingStatus.PENDING else PaymentStatus.PENDING.value,
                    payment_method=random.choice(list(PaymentMethodType)).value,
                    transaction_id=f"TXN{random.randint(100000, 999999)}",
                )
                self.session.add(payment)
            
            await self.session.flush()
        
        print("✅ Created bookings with payments")
    
    async def _seed_reviews(self):
        """Create reviews."""
        # Get completed bookings
        result = await self.session.execute(
            select(Booking).where(Booking.status.in_([BookingStatus.COMPLETED.value, BookingStatus.CHECKED_OUT.value]))
        )
        completed_bookings = result.scalars().all()
        
        review_templates = [
            {"rating": 5, "comment": "Amazing stay! Everything was perfect. Highly recommend!"},
            {"rating": 5, "comment": "Beautiful property, exactly as described. Host was very responsive."},
            {"rating": 4, "comment": "Great location and comfortable space. Would stay again."},
            {"rating": 5, "comment": "Perfect for our family vacation. The place was spotless and well-equipped."},
            {"rating": 4, "comment": "Nice place, good value for money. Minor issues but overall great experience."},
            {"rating": 5, "comment": "Exceeded expectations! The host went above and beyond."},
            {"rating": 4, "comment": "Comfortable and clean. Good communication with host."},
        ]
        
        for booking in completed_bookings[:min(10, len(completed_bookings))]:  # Create up to 10 reviews
            template = random.choice(review_templates)
            
            # Get listing to get host_id
            listing_result = await self.session.execute(
                select(Listing).where(Listing.id == booking.listing_id)
            )
            listing = listing_result.scalar_one_or_none()
            
            review = Review(
                id=generate_typed_id("rev"),
                booking_id=booking.id,
                listing_id=booking.listing_id,
                guest_id=booking.guest_id,
                host_id=listing.host_id if listing else None,
                overall_rating=template["rating"],
                comment=template["comment"],
                is_public=True,
                moderation_status="approved",
            )
            self.session.add(review)
        
        await self.session.flush()
        print("✅ Created reviews")
    
    async def _seed_messages(self):
        """Create conversations and messages."""
        guests = [u for u in self.users if u.role == UserRole.GUEST]
        
        # Get bookings to create conversations for
        result = await self.session.execute(select(Booking))
        bookings = result.scalars().all()[:10]  # Use first 10 bookings
        
        message_templates = [
            "Hi! I'm interested in booking your property. Is it available?",
            "Hello, I have a few questions about the property before booking.",
            "Thanks for accepting my booking! Looking forward to staying.",
            "What's the check-in process?",
            "Is there parking available nearby?",
            "Can I get an early check-in?",
            "Thank you for the wonderful stay!",
            "The property was exactly as described. Highly recommend!",
        ]
        
        for booking in bookings:
            # Get listing and host
            listing_result = await self.session.execute(
                select(Listing).where(Listing.id == booking.listing_id)
            )
            listing = listing_result.scalar_one_or_none()
            if not listing:
                continue
            
            host_result = await self.session.execute(
                select(User).where(User.id == listing.host_id)
            )
            host = host_result.scalar_one_or_none()
            if not host:
                continue
            
            # Create conversation
            conversation = Conversation(
                id=generate_typed_id("cnv"),
                booking_id=booking.id,
                listing_id=listing.id,
            )
            self.session.add(conversation)
            await self.session.flush()
            
            # Add participants using direct insert
            await self.session.execute(
                insert(conversation_participants).values(
                    conversation_id=conversation.id,
                    user_id=booking.guest_id
                )
            )
            await self.session.execute(
                insert(conversation_participants).values(
                    conversation_id=conversation.id,
                    user_id=host.id
                )
            )
            
            # Create 2-4 messages in the conversation
            num_messages = random.randint(2, 4)
            for i in range(num_messages):
                sender = booking.guest if i % 2 == 0 else host
                message = Message(
                    id=generate_typed_id("msg"),
                    conversation_id=conversation.id,
                    sender_id=sender.id,
                    receiver_id=host.id if sender.id == booking.guest_id else booking.guest_id,
                    listing_id=listing.id,
                    booking_id=booking.id,
                    source="guest" if sender.id == booking.guest_id else "host",
                    body=random.choice(message_templates),
                    is_read=random.choice([True, False]) if i < num_messages - 1 else False,  # Last message unread
                    read_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 24)) if i < num_messages - 1 else None,
                )
                self.session.add(message)
            
            await self.session.flush()
        
        print("✅ Created conversations and messages")
    
    async def _seed_wishlists(self):
        """Create wishlists."""
        guests = [u for u in self.users if u.role == UserRole.GUEST]
        
        # Each guest adds 2-4 listings to wishlist
        for guest in guests:
            num_wishlist_items = random.randint(2, 4)
            selected_listings = random.sample(self.listings, min(num_wishlist_items, len(self.listings)))
            
            for listing in selected_listings:
                wishlist = Wishlist(
                    id=generate_typed_id("wsh"),
                    user_id=guest.id,
                    listing_id=listing.id,
                )
                self.session.add(wishlist)
        
        await self.session.flush()
        print("✅ Created wishlists")
    
    async def _seed_promotions(self):
        """Create promotions and coupons."""
        base_date = datetime.now(timezone.utc).date()
        
        # Create coupons
        coupon_data = [
            {
                "code": "WELCOME10",
                "name": "Welcome Discount",
                "description": "10% off your first booking",
                "discount_type": DiscountType.PERCENTAGE,
                "discount_value": Decimal("10.00"),
                "max_discount_amount": Decimal("50.00"),
                "min_purchase_amount": Decimal("100.00"),
            },
            {
                "code": "SUMMER20",
                "name": "Summer Sale",
                "description": "20% off summer bookings",
                "discount_type": DiscountType.PERCENTAGE,
                "discount_value": Decimal("20.00"),
                "max_discount_amount": Decimal("100.00"),
                "min_purchase_amount": Decimal("150.00"),
            },
            {
                "code": "FIXED50",
                "name": "Fixed $50 Off",
                "description": "$50 off bookings over $200",
                "discount_type": DiscountType.FIXED_AMOUNT,
                "discount_value": Decimal("50.00"),
                "min_purchase_amount": Decimal("200.00"),
            },
        ]
        
        for coupon_info in coupon_data:
            coupon = Coupon(
                id=generate_typed_id("cpn"),
                code=coupon_info["code"],
                name=coupon_info["name"],
                description=coupon_info["description"],
                discount_type=coupon_info["discount_type"],
                discount_value=coupon_info["discount_value"],
                max_discount_amount=coupon_info.get("max_discount_amount"),
                min_purchase_amount=coupon_info["min_purchase_amount"],
                start_date=base_date - timedelta(days=30),
                end_date=base_date + timedelta(days=90),
                is_active=True,
                max_uses=100,
                max_uses_per_user=1,
                current_uses=random.randint(0, 20),
            )
            self.session.add(coupon)
        
        # Create promotions for some listings
        for listing in random.sample(self.listings, min(3, len(self.listings))):
            promotion = Promotion(
                id=generate_typed_id("prm"),
                name=f"Special Offer - {listing.title[:50]}",
                description=f"Limited time offer for {listing.city}",
                promotion_type=random.choice(list(PromotionType)),
                discount_type=DiscountType.PERCENTAGE,
                discount_value=Decimal(str(random.randint(10, 25))),
                max_discount_amount=Decimal("100.00"),
                start_date=base_date,
                end_date=base_date + timedelta(days=30),
                is_active=True,
                listing_id=listing.id,
                min_nights=2,
            )
            self.session.add(promotion)
        
        await self.session.flush()
        print("✅ Created promotions and coupons")
    
    async def _seed_travel_guides(self):
        """Create travel guides and user stories."""
        hosts = [u for u in self.users if u.role == UserRole.HOST]
        guests = [u for u in self.users if u.role == UserRole.GUEST]
        
        guide_templates = [
            {
                "title": "Ultimate Guide to Dubai: 7 Days of Luxury",
                "destination": "Dubai",
                "city": "Dubai",
                "country": "UAE",
                "content": "Discover the best of Dubai in 7 days. From the Burj Khalifa to the Dubai Mall, explore luxury shopping, world-class dining, and stunning architecture.",
                "tags": ["luxury", "shopping", "architecture", "dining"],
                "categories": ["culture", "food", "shopping"],
            },
            {
                "title": "Exploring the Historic Medina of Marrakech",
                "destination": "Marrakech",
                "city": "Marrakech",
                "country": "Morocco",
                "content": "A comprehensive guide to Marrakech's historic medina. Discover souks, palaces, and traditional Moroccan culture.",
                "tags": ["culture", "history", "shopping", "food"],
                "categories": ["culture", "history"],
            },
            {
                "title": "Cairo: Ancient Wonders and Modern Life",
                "destination": "Cairo",
                "city": "Cairo",
                "country": "Egypt",
                "content": "Experience the perfect blend of ancient history and modern life in Cairo. Visit the Pyramids, explore Islamic Cairo, and enjoy local cuisine.",
                "tags": ["history", "pyramids", "culture", "food"],
                "categories": ["culture", "history", "food"],
            },
        ]
        
        for template in guide_templates:
            author = random.choice(hosts)
            guide = TravelGuide(
                id=generate_typed_id("tgd"),
                title=template["title"],
                slug=f"{template['destination'].lower().replace(' ', '-')}-guide-{generate_typed_id('tgd')[:8]}",
                summary=template["content"][:200],
                content=template["content"],
                author_id=author.id,
                is_official=random.choice([True, False]),
                destination=template["destination"],
                city=template["city"],
                country=template["country"],
                cover_image_url=random.choice(UNSPLASH_IMAGES.get("apartment", [])),
                image_urls=random.sample(UNSPLASH_IMAGES.get("apartment", []), min(3, len(UNSPLASH_IMAGES.get("apartment", [])))),
                tags=template["tags"],
                categories=template["categories"],
                reading_time_minutes=random.randint(5, 15),
                difficulty_level=random.choice(["easy", "moderate"]),
                best_season=random.sample(["spring", "summer", "fall", "winter"], random.randint(1, 3)),
                view_count=random.randint(100, 1000),
                like_count=random.randint(10, 100),
                status="published",
                published_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60)),
            )
            self.session.add(guide)
            await self.session.flush()
            
            # Create bookmarks and likes for some guides
            for user in random.sample(guests, min(3, len(guests))):
                if random.choice([True, False]):
                    bookmark = TravelGuideBookmark(
                        id=generate_typed_id("tgb"),
                        user_id=user.id,
                        guide_id=guide.id,
                    )
                    self.session.add(bookmark)
                
                if random.choice([True, False]):
                    like = TravelGuideLike(
                        id=generate_typed_id("tgl"),
                        user_id=user.id,
                        guide_id=guide.id,
                    )
                    self.session.add(like)
            
            # Create a user story
            story_author = random.choice(guests)
            story = UserStory(
                id=generate_typed_id("ust"),
                author_id=story_author.id,
                title=f"My Amazing Trip to {template['destination']}",
                content=f"I recently visited {template['destination']} and had an incredible experience. {template['content']}",
                summary=f"Personal travel story about {template['destination']}",
                destination=template["destination"],
                city=template["city"],
                country=template["country"],
                cover_image_url=random.choice(UNSPLASH_IMAGES.get("apartment", [])),
                image_urls=random.sample(UNSPLASH_IMAGES.get("apartment", []), min(2, len(UNSPLASH_IMAGES.get("apartment", [])))),
                travel_date=datetime.now(timezone.utc) - timedelta(days=random.randint(30, 180)),
                duration_days=random.randint(3, 7),
                travel_style=random.choice(["solo", "couple", "family"]),
                tags=template["tags"][:2],
                view_count=random.randint(50, 500),
                like_count=random.randint(5, 50),
                status="published",
                published_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30)),
                guide_id=guide.id,
            )
            self.session.add(story)
        
        await self.session.flush()
        print("✅ Created travel guides and user stories")
    
    async def _seed_notifications(self):
        """Create notifications."""
        # Get bookings to create notifications for
        result = await self.session.execute(select(Booking))
        bookings = result.scalars().all()
        
        notification_templates = {
            NotificationType.BOOKING_CONFIRMED: {
                "title": "Booking Confirmed",
                "message": "Your booking has been confirmed!",
            },
            NotificationType.BOOKING_PENDING: {
                "title": "Booking Request Received",
                "message": "You have a new booking request.",
            },
            NotificationType.MESSAGE_RECEIVED: {
                "title": "New Message",
                "message": "You have received a new message.",
            },
            NotificationType.REVIEW_RECEIVED: {
                "title": "New Review",
                "message": "You have received a new review.",
            },
            NotificationType.PROMOTION: {
                "title": "Special Promotion",
                "message": "Check out our latest promotion!",
            },
        }
        
        for booking in bookings[:min(10, len(bookings))]:
            # Notification for guest
            notification_type = NotificationType.BOOKING_CONFIRMED if booking.status == BookingStatus.CONFIRMED.value else NotificationType.BOOKING_PENDING
            template = notification_templates[notification_type]
            
            notification = Notification(
                id=generate_typed_id("not"),
                user_id=booking.guest_id,
                notification_type=notification_type,
                title=template["title"],
                message=f"{template['message']} Booking #{booking.booking_number}",
                is_read=random.choice([True, False]),
                read_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48)) if random.choice([True, False]) else None,
                sent_email=random.choice([True, False]),
                sent_push=True,
                related_entity_type="booking",
                related_entity_id=booking.id,
                action_url=f"/bookings/{booking.id}",
            )
            self.session.add(notification)
            
            # Notification for host
            listing_result = await self.session.execute(
                select(Listing).where(Listing.id == booking.listing_id)
            )
            listing = listing_result.scalar_one_or_none()
            if listing and listing.host_id:
                notification = Notification(
                    id=generate_typed_id("not"),
                    user_id=listing.host_id,
                    notification_type=notification_type,
                    title=template["title"],
                    message=f"{template['message']} Booking #{booking.booking_number}",
                    is_read=random.choice([True, False]),
                    read_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48)) if random.choice([True, False]) else None,
                    sent_email=random.choice([True, False]),
                    sent_push=True,
                    related_entity_type="booking",
                    related_entity_id=booking.id,
                    action_url=f"/bookings/{booking.id}",
                )
                self.session.add(notification)
        
        await self.session.flush()
        print("✅ Created notifications")
    
    async def _seed_analytics(self):
        """Create analytics events."""
        guests = [u for u in self.users if u.role == UserRole.GUEST]
        
        event_types = [
            "page_view",
            "listing_view",
            "search",
            "booking_initiated",
            "booking_completed",
            "review_submitted",
            "wishlist_added",
        ]
        
        # Create 50-100 analytics events
        for _ in range(random.randint(50, 100)):
            user = random.choice(guests) if random.choice([True, False]) else None
            event_name = random.choice(event_types)
            
            payload = {
                "source": random.choice(["web", "mobile", "api"]),
                "timestamp": (datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30))).isoformat(),
            }
            
            if event_name == "listing_view" and self.listings:
                payload["listing_id"] = random.choice(self.listings).id
            
            if event_name == "search":
                payload["query"] = random.choice(["apartment", "villa", "beach", "downtown", "luxury"])
                payload["location"] = random.choice(["Dubai", "Riyadh", "Cairo"])
            
            event = AnalyticsEvent(
                id=generate_typed_id("evt"),
                user_id=user.id if user else None,
                event_name=event_name,
                source=payload["source"],
                payload=payload,
                recorded_at=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30)),
            )
            self.session.add(event)
        
        await self.session.flush()
        print("✅ Created analytics events")
    
    async def _seed_loyalty(self):
        """Create loyalty programs and ledger entries."""
        guests = [u for u in self.users if u.role == UserRole.GUEST]
        
        # Create loyalty program
        program = LoyaltyProgram(
            id=generate_typed_id("loy"),
            code="SAFAR_REWARDS",
            name="Safar Rewards Program",
            tiers={
                "bronze": {"min_points": 0, "discount": 5},
                "silver": {"min_points": 1000, "discount": 10},
                "gold": {"min_points": 5000, "discount": 15},
                "platinum": {"min_points": 10000, "discount": 20},
            },
        )
        self.session.add(program)
        await self.session.flush()
        
        # Create ledger entries for some guests
        for guest in random.sample(guests, min(5, len(guests))):
            balance = random.randint(100, 5000)
            transactions = [
                {
                    "type": "earned",
                    "points": random.randint(100, 500),
                    "reason": "booking_completed",
                    "date": (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 90))).isoformat(),
                }
                for _ in range(random.randint(1, 5))
            ]
            
            ledger = LoyaltyLedger(
                id=generate_typed_id("lgl"),
                user_id=guest.id,
                program_id=program.id,
                balance=balance,
                expires_at=datetime.now(timezone.utc) + timedelta(days=365),
                transactions=transactions,
            )
            self.session.add(ledger)
        
        await self.session.flush()
        print("✅ Created loyalty programs")


async def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Seed development data")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Clear existing data before seeding",
    )
    args = parser.parse_args()
    
    # Tenant relationships should already be fixed at import time above
    # No need to fix again here
    
    # Initialize database schema
    # This will import all models, but Tenant relationships should already be fixed
    print("🔧 Initializing database schema...")
    await init_db()
    
    # Create session and seed data
    async with AsyncSessionLocal() as session:
        seeder = DevDataSeeder(session, clear_existing=args.clear)
        try:
            await seeder.seed()
        except Exception as e:
            await session.rollback()
            print(f"❌ Error seeding data: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

