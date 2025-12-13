# Backend API Requirements for Frontend Integration

**Generated:** December 2024  
**Status:** High Priority - Required for Production

This document outlines the backend API endpoints that need to be implemented to complete the frontend integration.

---

## 1. Agency Management APIs (CRITICAL)

The frontend has been fully implemented and is ready to connect. These endpoints are required for agency functionality.

### Base Path
All agency endpoints should be under `/api/v1/agencies`

### Required Endpoints

#### 1.1 Create Agency
- **Endpoint:** `POST /api/v1/agencies`
- **Auth:** Required (authenticated user)
- **Request Body:**
  ```json
  {
    "name": "string (required, min 3, max 255)",
    "description": "string (optional)",
    "email": "string (required, valid email)",
    "phone_number": "string (optional)",
    "website": "string (optional, valid URL)",
    "address": "string (optional)",
    "city": "string (optional)",
    "country": "string (optional)"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": "string",
    "name": "string",
    "slug": "string (auto-generated)",
    "description": "string | null",
    "logo_url": "string | null",
    "email": "string",
    "phone_number": "string | null",
    "website": "string | null",
    "address": "string | null",
    "country": "string | null",
    "city": "string | null",
    "is_active": "boolean",
    "settings": "object (optional)",
    "created_at": "ISO 8601 string",
    "updated_at": "ISO 8601 string"
  }
  ```
- **Notes:**
  - Should automatically assign user to agency
  - Should update user role to include "agency"
  - Slug should be auto-generated from name

#### 1.2 Get Current User's Agency
- **Endpoint:** `GET /api/v1/agencies/me`
- **Auth:** Required (authenticated user with agency role)
- **Response:** `200 OK`
  ```json
  {
    "id": "string",
    "name": "string",
    "slug": "string",
    "description": "string | null",
    "logo_url": "string | null",
    "email": "string",
    "phone_number": "string | null",
    "website": "string | null",
    "address": "string | null",
    "country": "string | null",
    "city": "string | null",
    "is_active": "boolean",
    "settings": "object (optional)",
    "created_at": "ISO 8601 string",
    "updated_at": "ISO 8601 string"
  }
  ```
- **Error:** `404 Not Found` if user doesn't have an agency

#### 1.3 Update Current User's Agency
- **Endpoint:** `PUT /api/v1/agencies/me`
- **Auth:** Required (authenticated user with agency role)
- **Request Body:** (all fields optional)
  ```json
  {
    "name": "string (optional)",
    "description": "string (optional)",
    "email": "string (optional, valid email)",
    "phone_number": "string (optional)",
    "website": "string (optional, valid URL)",
    "address": "string (optional)",
    "city": "string (optional)",
    "country": "string (optional)"
  }
  ```
- **Response:** `200 OK` (same as GET /api/v1/agencies/me)
- **Notes:**
  - Only agency owner/admin can update
  - Slug should not be updatable

#### 1.4 Get Agency Listings
- **Endpoint:** `GET /api/v1/agencies/listings`
- **Auth:** Required (authenticated user with agency role)
- **Query Parameters:**
  - `skip`: number (optional, default: 0)
  - `limit`: number (optional, default: 50, max: 100)
  - `status`: string (optional, filter by listing status)
- **Response:** `200 OK`
  ```json
  {
    "items": [
      {
        "id": "string",
        "title": "string",
        "city": "string",
        "country": "string",
        "base_price": "number",
        "status": "string",
        // ... other listing fields
      }
    ],
    "total": "number",
    "skip": "number",
    "limit": "number"
  }
  ```
- **Notes:**
  - Should return only listings where `agency_id` matches user's agency
  - Should support pagination

#### 1.5 Get Agency Bookings
- **Endpoint:** `GET /api/v1/agencies/bookings`
- **Auth:** Required (authenticated user with agency role)
- **Query Parameters:**
  - `skip`: number (optional, default: 0)
  - `limit`: number (optional, default: 50, max: 100)
  - `status`: string (optional, filter by booking status)
- **Response:** `200 OK`
  ```json
  {
    "items": [
      {
        "id": "string",
        "booking_number": "string",
        "listing_id": "string",
        "guest_id": "string",
        "check_in": "ISO 8601 string",
        "check_out": "ISO 8601 string",
        "guests": "number",
        "total_amount": "number",
        "status": "string",
        // ... other booking fields
      }
    ],
    "total": "number",
    "skip": "number",
    "limit": "number"
  }
  ```
- **Notes:**
  - Should return bookings for all listings under the agency
  - Should support pagination

---

## 2. Listings API Enhancement (HIGH PRIORITY)

### Add Host ID Filter

#### Current Endpoint
- **Endpoint:** `GET /api/v1/listings`
- **Current Query Parameters:**
  - `skip`, `limit`, `city`, `country`, `listing_type`, `min_price`, `max_price`, `min_guests`, `status`

#### Required Addition
- **New Query Parameter:** `host_id` (optional, string)
  - Filter listings by host ID
  - Should work in combination with existing filters

#### Example Request
```
GET /api/v1/listings?host_id=abc123&status=active&limit=50
```

#### Implementation Notes
- This will significantly improve performance for host pages
- Currently, frontend fetches all listings and filters client-side (inefficient)
- Server-side filtering will reduce data transfer and improve response times

---

## 3. Implementation Priority

### Phase 1: Critical (Blocking Production)
1. ✅ Agency Management APIs (all 5 endpoints)
   - Frontend is fully implemented and waiting
   - Users cannot use agency features without these

### Phase 2: High Priority (Performance)
2. ✅ Listings API `host_id` filter
   - Improves host dashboard performance
   - Reduces unnecessary data transfer

---

## 4. Frontend Integration Status

### Agency Features
- ✅ **Frontend:** 100% Complete
- ⏳ **Backend:** 0% Complete (awaiting implementation)
- **Status:** Frontend ready, waiting for backend APIs

### Host Listings Filter
- ✅ **Frontend:** Ready to use `host_id` parameter when available
- ⏳ **Backend:** Needs `host_id` query parameter support
- **Status:** Frontend prepared, backend enhancement needed

---

## 5. Testing Requirements

### Agency APIs
- Test agency creation with valid/invalid data
- Test role assignment on agency creation
- Test agency retrieval for authenticated users
- Test agency update permissions
- Test listings/bookings filtering by agency
- Test error cases (404, 403, validation errors)

### Listings API Enhancement
- Test `host_id` filter in isolation
- Test `host_id` filter combined with other filters
- Test performance with large datasets
- Test pagination with `host_id` filter

---

## 6. OpenAPI Specification

When implementing, please ensure:
1. All endpoints are documented in OpenAPI/Swagger spec
2. Request/response schemas match the examples above
3. Error responses are properly documented
4. Authentication requirements are specified

The frontend uses generated TypeScript clients from the OpenAPI spec, so accurate documentation is critical.

---

## 7. Database Considerations

### Agency Model
The `Agency` model already exists in the database (`backend/app/modules/users/models.py`). Ensure:
- Relationships are properly set up (users, listings)
- Indexes are optimized for queries
- Slug generation is unique and URL-safe

### Listings Model
The `Listing` model already has `host_id` field. Ensure:
- Index on `host_id` for efficient filtering
- Query optimization for host-based filtering

---

## 8. Security Considerations

### Agency APIs
- Only authenticated users can create agencies
- Only agency members can access their agency data
- Agency updates should verify ownership
- Listings/bookings should only return data for user's agency

### Listings API
- `host_id` filter should respect privacy
- Public listings should be accessible
- Private/draft listings should only be visible to owner

---

## 9. Contact & Questions

For questions about frontend integration:
- See `web/src/generated/actions/agencies.ts` for expected function signatures
- See `web/src/features/agency/` for component implementations
- See `web/src/app/(agency)/` for page implementations

---

**Document Status:** Ready for Backend Implementation  
**Last Updated:** December 2024

