# Safar Platform Architecture

## Overview
Safar is a distributed travel platform that deliberately embraces a service-per-capability model. Services communicate asynchronously over NATS JetStream while Temporal workflows orchestrate long-running booking and payout sagas. Every service is a NestJS application running inside a single Nx workspace and shares a hardened toolkit exposed through `libs/common` and `libs/shared`.

```
API Gateway (GraphQL + WebSocket)
        |
 REST + gRPC BFF adapters
        |
 ├── Auth / Identity / User
 ├── Hosts / Listings / Availability / Pricing
 ├── Booking saga (Temporal) → Payment → Payout
 ├── Messaging / Review / Notification / Promotion / Loyalty / Dispute
 ├── AI Trip Planner (multi-LLM + function calling)
 ├── Search (Meilisearch + geo)
 └── Analytics & Admin
```

## Tech highlights
- **Nx + NestJS 11** for modular code and isolated builds.
- **Prisma + PostgreSQL + PostGIS** for relational + geo workloads.
- **Temporal.io** handles orchestration of booking + payout flows.
- **NATS JetStream** serves as the canonical event backbone.
- **BullMQ + Redis** manages background jobs and fan-out tasks.
- **Meilisearch v1.10** powers geo search and ranking.
- **OpenTelemetry + Jaeger** provide tracing, metrics, and profiling.

## Cross-cutting libraries
- `libs/shared` contains DTOs, event contracts (Zod), guards, pipes, filters, and a Prisma module that bundles Accelerate + Pulse.
- `libs/common` exposes `CoreModule` and `bootstrapServiceApp` so every service gets config validation, logging, tracing, caching, Prisma access, and message bus wiring with one import.
- `libs/infrastructure` houses adapters for Redis/BullMQ, NATS, Temporal, Meilisearch, and telemetry exporters.

## Data & Sagas
- **Schema**: `prisma/schema.prisma` defines 40+ models covering guests, hosts, listings, pricing rules, bookings, payments, payouts, reviews, disputes, analytics, and webhook deliveries.
- **Booking saga**: `booking-service` registers Temporal workflows that coordinate availability locks, payment authorization, host confirmation, and notification fan-out.
- **Payout saga**: `payout-service` listens to booking events and drives host disbursements with retries plus audit logging.

## Observability
- OpenTelemetry SDK bootstraps automatically in every service via the `TelemetryModule`.
- Traces are exported to OTLP/HTTP (Jaeger or any OTLP collector).
- Structured logging uses Pino with service metadata so logs stay searchable in any stack (ELK, Loki, etc.).

## Local development
1. `cp backend/.env.example backend/.env` and adjust secrets.
2. `docker compose up postgres redis nats temporal meilisearch jaeger`.
3. `npm install` inside `backend/`.
4. `npm run dev` to run all services, or `nx serve <service>` individually.

## Deployment model
- CI (GitHub Actions) runs lint → test → build → docker image.
- Each service can be containerized independently; the gateway image ships by default.
- Temporal, NATS, Redis, Postgres, and Meilisearch are provisioned as managed services in production.

