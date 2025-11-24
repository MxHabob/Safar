# Safar Backend · منصة سفر عالمية

**EN:** Safar is an enterprise-grade travel platform that out-innovates legacy OTAs by combining a GraphQL + WebSocket API gateway, decoupled microservices, and ML-powered pricing/search pipelines.  
**AR:** سفار هي منصة سفر احترافية تفوق Airbnb بسنوات ضوئية عبر معماريّة ميكروخدمات مدعومة بـ GraphQL، WebSocket، وذكاء اصطناعي للتسعير والبحث.

## ✨ Highlights / المزايا
- **Nx 22 + NestJS 11 + TypeScript 5.6** Mono-repo with 20+ domain services.
- **Prisma + PostgreSQL + PostGIS** مع تفعيل Prisma Accelerate و Pulse.
- **Temporal.io + NATS JetStream** لإدارة Saga الخاصة بالحجوزات والمدفوعات.
- **BullMQ + Redis, Meilisearch v1.10, OpenTelemetry + Jaeger** لمراقبة كاملة.
- **AI Trip Planner** مع تكامل OpenAI, Claude, Grok, Llama3 باستخدام function calling.

## 📁 Repository Layout / هيكل المستودع
```
backend/
 ├── apps/                # كل خدمة مستقلة (auth, booking, pricing, ...)
 ├── libs/
 │   ├── shared/          # DTOs, events (Zod), Prisma, guards, pipes...
 │   ├── common/          # CoreModule + bootstrap helpers
 │   └── infrastructure/  # Redis, NATS, Meilisearch, Temporal, OTEL
 ├── prisma/              # schema.prisma (35+ models) + migrations
 ├── tools/               # سكربتات وأدوات التطوير
 ├── docs/ARCHITECTURE.md # نظرة عالية المستوى
 ├── docker-compose.yml   # بيئة محلية كاملة
 ├── Dockerfile           # بناء متعدد المراحل
 └── .github/workflows/ci.yml
```

## 🚀 Quick start / البدء السريع
```bash
cd backend
cp .env.example .env
npm install
docker compose up postgres redis nats temporal meilisearch jaeger -d
npx prisma migrate deploy
npm run dev          # يشغل جميع الخدمات بشكل متوازي
# أو خدمة محددة
npx nx serve booking-service
```

## 🧰 Useful scripts / سكربتات مهمة
- `npm run dev` : تشغيل جميع الخدمات بنمط watch.
- `npm run lint` : التحقق من جودة الكود.
- `npm run test` : تشغيل وحدات الاختبار.
- `npm run build` : بناء جميع الخدمات.
- `npm run docker:compose` : تشغيل البيئة المحلية الكاملة.
- `npm run prisma:*` : أوامر Prisma (generate, migrate, deploy).

## 🔐 Observability & Security
- جميع الخدمات تستدعي `CoreModule` الذي يفعّل:
  - Zod-based env validation.
  - PrismaService مع Accelerate + Pulse.
  - Pino logging + OpenTelemetry auto instrumentation.
  - اتصال NATS JetStream, Redis/BullMQ, Temporal Client, Meilisearch.
  - حمايات class-validator / class-transformer، معدل الطلبات، و Device fingerprinting APIs.

## 📡 API Gateway
- GraphQL (code-first) + Apollo Server v4 مع Subscriptions/WebSocket.
- REST fallback عبر نمط BFF، و Socket.io لتراسل الرسائل الفوري.
- Integrates GraphQL Codegen (instructions داخل `docs/ARCHITECTURE.md`).

## 🧠 AI Trip Planner
- `apps/ai-trip-planner` يستدعي مزودات متعددة (OpenAI, Claude, Grok, Llama3) مع نظام Function Calling موحد.
- استجابات مدعومة بـ DTOs مشتركة، ويتم بث النتائج عبر NATS + WebSocket.

## 🧾 Testing
- وحدات Jest افتراضية لكل مكتبة.
- `libs/shared/testing` يوفر TestHarness + factories.
- Temporal workflows قابلة للاختبار عبر `@temporalio/worker` في وضع dev.

## 🛡 ترخيص / License
MIT – استخدمها وطورها كيفما تشاء، مع الحفاظ على نسب الفضل.

---
> **ملاحظات إضافية:** اطلع على `docs/ARCHITECTURE.md` لمزيد من التفاصيل حول تدفقات الحجز، التسويات المالية، ونظام المراقبة. لأي خدمة جديدة أضفها تحت `apps/` واستورد `CoreModule` لضمان الاتساق الأمني والتشغيلي.
