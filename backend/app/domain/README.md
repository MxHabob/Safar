# Domain Layer

## Overview
This layer contains business logic and domain entities, independent of infrastructure concerns.

## Structure

### Base Classes
- `base.py` - Base classes for domain entities
  - `DomainEntity` - Base class for all domain entities
  - `ValueObject` - Base class for value objects

### Domain Entities
- `entities/listing.py` - Listing domain entity with business logic
- `entities/user.py` - User domain entity with business logic
- `entities/booking.py` - Booking domain entity with business logic

## Domain Entities

### ListingEntity
Business logic methods:
- `is_active()` - Check if listing is active
- `is_draft()` - Check if listing is draft
- `can_be_booked()` - Check if listing can be booked
- `calculate_total_price(nights)` - Calculate total price

### UserEntity
Business logic methods:
- `is_host()` - Check if user is a host
- `is_admin()` - Check if user is admin
- `is_verified()` - Check if user is verified
- `get_display_name()` - Get display name

### BookingEntity
Business logic methods:
- `is_confirmed()` - Check if booking is confirmed
- `is_pending()` - Check if booking is pending
- `is_cancelled()` - Check if booking is cancelled
- `is_paid()` - Check if booking is paid
- `can_be_cancelled()` - Check if booking can be cancelled
- `is_overlapping()` - Check date overlap with other booking

## Benefits
- Business logic encapsulation
- Domain-driven design
- Independent of infrastructure
- Testable business rules

