# Development Data Seeding Guide

This guide explains how to populate your database with realistic development data including users, listings, bookings, reviews, and more - all with real images from Unsplash.

## Overview

The seed script (`seed_dev_data.py`) creates:
- **Users**: Admin, hosts, and guests with realistic profiles
- **Listings**: 8+ properties with real images, amenities, pricing, and availability
- **Amenities**: 15+ common amenities (WiFi, pool, kitchen, etc.)
- **Bookings**: Sample bookings with various statuses
- **Reviews**: Reviews for completed bookings
- **Payments**: Payment records for confirmed bookings
- **Conversations & Messages**: Message threads between guests and hosts
- **Wishlists**: Saved listings for guests
- **Promotions & Coupons**: Discount codes and promotional offers
- **Travel Guides**: Curated travel guides with user stories
- **Notifications**: In-app notifications for various events
- **Analytics Events**: User activity tracking events
- **Loyalty Programs**: Rewards program with ledger entries

## Prerequisites

1. **Database Setup**: Ensure your PostgreSQL database is running and configured
2. **Environment**: Set up your `.env` file with database credentials
3. **Dependencies**: All required Python packages should be installed

## Usage

### Basic Seeding (Recommended)

Seed data without clearing existing records:

```bash
cd backend
python -m scripts.seed_dev_data
```

### Clear and Seed

Clear all existing data before seeding (useful for fresh starts):

```bash
cd backend
python -m scripts.seed_dev_data --clear
```

## What Gets Created

### Users

**Admin User:**
- Email: `admin@safar.com`
- Password: `admin123`
- Role: Admin

**Host Users (5):**
- Emails: `ahmed.host@safar.com`, `fatima.host@safar.com`, etc.
- Password: `host123`
- Role: Host
- Each host has a verified host profile

**Guest Users (6):**
- Emails: `layla.guest@safar.com`, `youssef.guest@safar.com`, etc.
- Password: `guest123`
- Role: Guest

### Listings

8+ listings across different types:
- Apartments
- Villas
- Houses
- Studios
- Condos
- Cabins
- Boats
- Townhouses

Each listing includes:
- Real images from Unsplash (3-5 images per listing)
- Location data with PostGIS coordinates
- Pricing and availability calendar (90 days)
- Amenities (5-10 per listing)
- Rules (smoking, pets, parties)
- Realistic descriptions and metadata

### Amenities

15+ amenities including:
- Basic: WiFi, Air Conditioning, Kitchen, Parking, etc.
- Entertainment: Pool, Hot Tub, Gym, TV
- Safety: Smoke Alarm, Carbon Monoxide Alarm, Fire Extinguisher

### Bookings

15+ bookings with:
- Various statuses (Pending, Confirmed, Completed, Checked Out)
- Realistic dates (past and future)
- Payment records for confirmed/completed bookings

### Reviews

Reviews for completed bookings with:
- Ratings (4-5 stars)
- Realistic comments
- Approved moderation status

### Conversations & Messages

10+ conversations with:
- Message threads between guests and hosts
- Related to bookings
- Mix of read and unread messages
- Realistic conversation content

### Wishlists

Wishlist items for guests:
- Each guest has 2-4 saved listings
- Unique constraints prevent duplicates

### Promotions & Coupons

- **3 Coupons**: Welcome discount, Summer sale, Fixed amount discount
- **3 Promotions**: Special offers for selected listings
- Valid dates and usage limits
- Various discount types (percentage, fixed amount)

### Travel Guides

- **3 Travel Guides**: Dubai, Marrakech, Cairo guides
- Cover images and multiple photos
- Tags and categories
- User stories linked to guides
- Bookmarks and likes from users
- Published status with engagement metrics

### Notifications

- Notifications for bookings (confirmed, pending)
- Mix of read and unread notifications
- Email and push notification flags
- Related entity links

### Analytics Events

- 50-100 analytics events
- Various event types (page_view, listing_view, search, etc.)
- User tracking
- Realistic timestamps (last 30 days)

### Loyalty Programs

- **1 Loyalty Program**: Safar Rewards with 4 tiers
- Ledger entries for 5+ guests
- Point balances and transaction history
- Expiration dates

## Image Sources

All images are sourced from **Unsplash** using their public API. Images are:
- High quality (800x600px)
- Properly formatted for web use
- Free to use (Unsplash license)
- Reliable and fast-loading

The script uses specific Unsplash image IDs for reliability, ensuring images load consistently.

## Best Practices

### Idempotency

The script is designed to be **idempotent** - you can run it multiple times safely:
- Uses `--clear` flag to remove existing data first
- Checks for existing amenities before creating duplicates
- Uses unique constraints to prevent duplicates

### Data Quality

- **Realistic Data**: All data follows realistic patterns
- **Proper Relationships**: Foreign keys and relationships are correctly maintained
- **Valid IDs**: Uses the application's ID generation system
- **Proper Types**: All data types match the database schema

### Security

- **Password Hashing**: All passwords are properly hashed using bcrypt
- **No Sensitive Data**: No real personal information is used
- **Development Only**: This script is for development environments only

## Troubleshooting

### Database Connection Errors

If you get connection errors:
1. Check your `.env` file has correct database credentials
2. Ensure PostgreSQL is running
3. Verify the database exists

### Import Errors

If you get import errors:
1. Make sure you're running from the `backend` directory
2. Ensure all dependencies are installed: `pip install -r requirements.txt`
3. Check that the Python path includes the backend directory

### Foreign Key Errors

If you get foreign key constraint errors:
1. Use `--clear` flag to remove existing data first
2. Ensure database migrations are up to date
3. Check that all required tables exist

### Image Loading Issues

If images don't load:
1. Check your internet connection (images are loaded from Unsplash)
2. Verify Unsplash URLs are accessible
3. Check browser console for CORS or loading errors

## Customization

You can customize the seed data by editing `seed_dev_data.py`:

- **Add more listings**: Add entries to `listing_templates`
- **Change locations**: Modify the `LOCATIONS` array
- **Add amenities**: Update `AMENITY_DATA`
- **Modify user data**: Edit user creation sections
- **Change image sources**: Update `UNSPLASH_IMAGES` dictionary

## Environment Variables

Make sure these are set in your `.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/safar_db
ENVIRONMENT=development
```

## Notes

- **Development Only**: This script is intended for development environments only
- **Not for Production**: Never run this script in production
- **Data Volume**: Creates moderate amounts of data suitable for development
- **Performance**: May take 30-60 seconds to complete depending on your system

## Support

If you encounter issues:
1. Check the error message carefully
2. Review the troubleshooting section above
3. Check database logs for detailed errors
4. Ensure all migrations are applied

## Example Output

```
🌱 Starting development data seeding...
🔧 Initializing database schema...
👥 Creating users...
✅ Created 12 users
🏠 Creating listings...
✅ Created 8 listings
✨ Creating amenities...
✅ Created/verified 15 amenities
🔗 Linking amenities to listings...
✅ Linked amenities to listings
📅 Creating bookings...
✅ Created bookings with payments
⭐ Creating reviews...
✅ Created reviews
✅ Development data seeding completed successfully!
```

