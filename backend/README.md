## Safar API - Integrated Travel Platform

Safar is a modern, fully featured travel platform built with FastAPI and PostgreSQL, designed to provide advanced capabilities comparable to (and beyond) Airbnb.

## Key Features

- **Full authentication system**: JWT, OAuth2 (Google, Apple), OTP
- **Property management**: Multiple property types with images and amenities
- **Advanced booking engine**: Instant and request-to-book flows
- **AI trip planner**: Generate smart travel plans from natural-language requests
- **Smart promotions and discounts**: Flash Sales, coupons, group discounts
- **Counter-offers**: “Name Your Price” style flows
- **Advanced reviews and ratings**: With AI-powered fraud detection
- **Multi-language and multi-currency support**: With on-the-fly conversion
- **Real-time chat**: WebSocket-based messaging
- **Multi-channel notifications**: Email, Push, SMS, in-app
- **Multi-tenancy**: Support for multiple travel agencies/organizations

## Tech Stack

- **Backend**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 16 with SQLAlchemy 2.0 (async)
- **Cache**: Redis
- **Background tasks**: Celery
- **AI**: OpenAI (GPT family models)
- **Authentication**: JWT, OAuth2
- **WebSockets**: For chat and real-time notifications
- **Migrations**: Alembic

## Installation & Setup

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optional, but recommended)

### 2. Environment Setup

```bash
# Clone the project
git clone <repository-url>
cd backend

# Create a virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On macOS/Linux

# Install requirements
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Then edit .env according to your environment
```

### 3. Database Setup

```bash
# Create the database (PostgreSQL)
createdb safar_db

# Run migrations
alembic upgrade head
```

### 4. Run the Application

```bash
# Development
uvicorn app.main:app --reload

# Production (basic example)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 5. Using Docker

```bash
# Start all services
docker-compose up -d

# Tail logs
docker-compose logs -f

# Stop services
docker-compose down
```

## API Documentation

Once the application is running, you can access:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

## Project Structure

```text
backend/
├── app/
│   ├── api/              # API routes (versioned routers)
│   ├── core/             # Core configuration and bootstrapping
│   ├── infrastructure/   # Infrastructure (Redis, WebSocket, storage, email, etc.)
│   ├── modules/          # Business modules (users, bookings, listings, payments, etc.)
│   └── shared/           # Shared utilities and base classes
├── alembic/              # Database migrations
├── tests/                # Unit, integration, and e2e tests
├── docker-compose.yml    # Docker configuration
├── Dockerfile            # Backend image definition
├── requirements.txt      # Python dependencies
└── .env.example          # Environment variables template
```

## Usage Examples

### 1. Register a new user

```bash
curl -X POST "http://localhost:8000/api/v1/users/register" ^
  -H "Content-Type: application/json" ^
  -d "{
    \"email\": \"user@example.com\",
    \"password\": \"securepassword123\",
    \"first_name\": \"John\",
    \"last_name\": \"Doe\"
  }"
```

### 2. Login

```bash
curl -X POST "http://localhost:8000/api/v1/users/login" ^
  -H "Content-Type: application/json" ^
  -d "{
    \"email\": \"user@example.com\",
    \"password\": \"securepassword123\"
  }"
```

### 3. Create an AI-powered travel plan

```bash
curl -X POST "http://localhost:8000/api/v1/ai/travel-planner" ^
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{
    \"destination\": \"Paris\",
    \"start_date\": \"2025-06-01\",
    \"end_date\": \"2025-06-06\",
    \"budget\": 3000,
    \"currency\": \"USD\",
    \"travelers_count\": 2,
    \"travel_style\": \"family\",
    \"natural_language_request\": \"Family trip to Paris for 5 days with a 3000 USD budget\"
  }"
```

## Development

### Creating a new migration

```bash
alembic revision --autogenerate -m "Description"
alembic upgrade head
``]

### Running tests

```bash
pytest
```

## Production

### Important environment variables

- `SECRET_KEY`: Must be random and strong (32+ chars)
- `DATABASE_URL`: PostgreSQL database URL
- `REDIS_URL`: Redis connection URL
- `OPENAI_API_KEY`: OpenAI API key
- `STRIPE_SECRET_KEY`: Stripe secret key (for payments)

## License

MIT License

## Support

For questions and support, please open an issue in the repository.

