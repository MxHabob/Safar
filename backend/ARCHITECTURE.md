# Architecture - البنية المعمارية

## Overview
تم إعادة بناء التطبيق لاستخدام **Repository Pattern** و **Domain-Driven Design (DDD)**.

## Architecture Layers

### 1. Domain Layer (طبقة النطاق)
**Location:** `app/domain/`

تحتوي على منطق الأعمال والكيانات المستقلة عن البنية التحتية.

#### Domain Entities
- `entities/listing.py` - ListingEntity مع منطق الأعمال
- `entities/user.py` - UserEntity مع منطق الأعمال
- `entities/booking.py` - BookingEntity مع منطق الأعمال

#### Domain Logic Examples
```python
# ListingEntity
listing.is_active()  # Check if listing is active
listing.can_be_booked()  # Check if listing can be booked
listing.calculate_total_price(nights)  # Calculate price

# UserEntity
user.is_host()  # Check if user is a host
user.is_verified()  # Check if user is verified

# BookingEntity
booking.can_be_cancelled()  # Check if booking can be cancelled
booking.is_overlapping()  # Check date overlap
```

### 2. Repository Layer (طبقة المستودعات)
**Location:** `app/repositories/`

تتعامل مع الوصول للبيانات وتجريد SQLAlchemy models.

#### Repositories
- `listings.py` - ListingRepository
- `users.py` - UserRepository
- `bookings.py` - BookingRepository
- `reviews.py` - ReviewRepository
- `messages.py` - MessageRepository

#### Unit of Work
- `unit_of_work.py` - يدير المعاملات ويجمع جميع الـ repositories

### 3. Service Layer (طبقة الخدمات)
**Location:** `app/modules/{module}/services.py`

تحتوي على منطق التطبيق الذي يستخدم Domain entities و Repositories.

#### Services
- `listings/services.py` - ListingService
- `users/services.py` - UserService
- `bookings/services.py` - BookingService

### 4. API Layer (طبقة API)
**Location:** `app/modules/{module}/routes.py`

تحتوي على FastAPI routes التي تستخدم Services.

## Data Flow

```
Request → Route → Service → Repository → Database
                ↓
            Domain Entity
                ↓
            Business Logic
```

## Example Flow

### Creating a Listing

1. **Route** (`listings/routes.py`)
   ```python
   @router.post("")
   async def create_listing(
       listing_data: ListingCreate,
       current_user: User,
       uow: IUnitOfWork = Depends(get_unit_of_work)
   ):
       listing = await ListingService.create_listing(uow, listing_data, current_user.id)
   ```

2. **Service** (`listings/services.py`)
   ```python
   async def create_listing(uow, listing_data, host_id):
       # Create domain entity
       listing = ListingEntity(...)
       
       # Use domain logic
       if listing.is_draft():
           listing.status = "draft"
       
       # Save through repository
       return await uow.listings.create(listing)
   ```

3. **Repository** (`repositories/listings.py`)
   ```python
   async def create(self, entity: ListingEntity):
       model = self._entity_to_model(entity)
       self.db.add(model)
       await self.db.commit()
       return self._model_to_entity(model)
   ```

## Benefits

1. **Separation of Concerns**
   - Business logic في Domain layer
   - Data access في Repository layer
   - Application logic في Service layer

2. **Testability**
   - سهولة mock للـ repositories
   - اختبار منطق الأعمال بشكل مستقل

3. **Maintainability**
   - كود منظم وواضح
   - سهولة التعديل والتوسع

4. **Transaction Management**
   - Unit of Work pattern لإدارة المعاملات

## Migration Notes

### Before (Old Pattern)
```python
# Direct database access in routes
@router.post("")
async def create_listing(db: AsyncSession, data: ListingCreate):
    listing = Listing(...)
    db.add(listing)
    await db.commit()
```

### After (New Pattern)
```python
# Using services and repositories
@router.post("")
async def create_listing(
    uow: IUnitOfWork,
    data: ListingCreate
):
    listing = await ListingService.create_listing(uow, data, user_id)
```

## Next Steps

1. إضافة Mappers للتحويل بين Domain entities و Response models
2. إضافة Validation في Domain layer
3. إضافة Events للـ Domain events
4. إضافة Caching layer

