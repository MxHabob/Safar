# Admin Module

## Overview

The admin module provides comprehensive administrative APIs for managing users, listings, bookings, payments, and viewing system analytics. All endpoints require admin or super_admin role with 2FA enabled.

## Structure

```
admin/
├── __init__.py       # Module initialization
├── routes.py         # API route definitions
├── schemas.py        # Pydantic request/response models
├── services.py       # Business logic layer
└── README.md         # This file
```

## Features

### User Management
- List all users with filters (role, status, search)
- Get user details
- Update user (role, status, active status)
- Suspend/activate users
- User statistics

### Dashboard & Analytics
- Dashboard metrics (bookings, revenue, users, listings)
- Booking trends over time
- Popular destinations analytics

### Listings Management
- List all listings (admin view)
- Get listing details by ID
- Listing statistics

### Bookings Management
- List all bookings (admin view)
- Get booking details by ID
- Booking statistics

### Payments Management
- List all payments (admin view)
- Get payment details by ID
- Payment statistics

## API Endpoints

### User Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/users` | GET | List all users with filters |
| `/api/v1/admin/users/{user_id}` | GET | Get user details |
| `/api/v1/admin/users/{user_id}` | PUT | Update user |
| `/api/v1/admin/users/{user_id}/suspend` | POST | Suspend user |
| `/api/v1/admin/users/{user_id}/activate` | POST | Activate user |
| `/api/v1/admin/users/stats` | GET | User statistics |

### Dashboard

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/dashboard/metrics` | GET | Dashboard metrics |
| `/api/v1/admin/dashboard/booking-trends` | GET | Booking trends |
| `/api/v1/admin/dashboard/popular-destinations` | GET | Popular destinations |

### Listings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/listings` | GET | List all listings |
| `/api/v1/admin/listings/{listing_id}` | GET | Get listing details |
| `/api/v1/admin/listings/stats` | GET | Listing statistics |

### Bookings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/bookings` | GET | List all bookings |
| `/api/v1/admin/bookings/{booking_id}` | GET | Get booking details |
| `/api/v1/admin/bookings/stats` | GET | Booking statistics |

### Payments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/payments` | GET | List all payments |
| `/api/v1/admin/payments/{payment_id}` | GET | Get payment details |
| `/api/v1/admin/payments/stats` | GET | Payment statistics |

## Authentication

All endpoints require:
- Admin or super_admin role
- 2FA enabled and verified
- Valid JWT token with `mfa_verified: true`

## Code Quality

### Best Practices Implemented

1. **Separation of Concerns**
   - Routes handle HTTP concerns only
   - Services contain business logic
   - Schemas define data contracts

2. **DRY Principle**
   - Reusable service methods
   - Shared query building logic
   - Common response patterns

3. **Type Safety**
   - Full type hints throughout
   - Pydantic models for validation
   - SQLAlchemy models for data access

4. **Error Handling**
   - Proper HTTP status codes
   - Descriptive error messages
   - 404 handling for missing resources

5. **Database Optimization**
   - Uses read replicas for read operations
   - Efficient queries with proper indexing
   - Pagination for large datasets

6. **Audit Logging**
   - Admin actions are logged
   - Tracks who did what and when

## Usage Examples

### List Users

```python
GET /api/v1/admin/users?skip=0&limit=50&role=host&status=active&search=john
```

### Get Dashboard Metrics

```python
GET /api/v1/admin/dashboard/metrics?start_date=2024-01-01&end_date=2024-01-31
```

### Update User

```python
PUT /api/v1/admin/users/USR123456
{
  "role": "host",
  "status": "active",
  "is_active": true
}
```

## Future Enhancements

- [ ] Listing approval workflow
- [ ] Review moderation
- [ ] Payment refund processing
- [ ] Bulk operations
- [ ] Advanced reporting
- [ ] Export functionality

## Testing

All endpoints should be tested with:
- Admin authentication
- Non-admin users (should fail)
- Invalid tokens
- Missing resources
- Edge cases (empty results, pagination boundaries)

## Security Notes

- All admin operations require 2FA
- Audit logs track all admin actions
- Rate limiting should be applied
- Input validation on all endpoints
- SQL injection protection via SQLAlchemy ORM

