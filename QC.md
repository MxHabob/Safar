# Quick Customization Plan: Adapting My Existing Next.js 16 Travel Template to My Actual Backend API

---

## 1. Quick Checklist (5 minutes)

### What are you looking for in the template to quickly understand its data flow?

**Key Files to Check First:**

1. **Generated API Client & Hooks** (Primary data fetching layer)
   - `web/src/generated/client/index.ts` - Main API client singleton
   - `web/src/generated/client/base.ts` - Base URL configuration (line 273: `process.env.NEXT_PUBLIC_API_URL`)
   - `web/src/generated/hooks/*.ts` - React Query hooks for client-side fetching
   - `web/src/generated/actions/*.ts` - Server Actions for server-side fetching

2. **Current Data Fetching Patterns**
   - **tRPC Usage**: `web/src/app/**/page.tsx` files use `trpc.*` (legacy pattern)
   - **Generated Actions**: `web/src/generated/actions/travelGuides.ts`, `users.ts`, `listings.ts`, etc.
   - **Generated Hooks**: `web/src/generated/hooks/travelGuides.ts`, `users.ts`, etc.

3. **Type Definitions**
   - `web/src/generated/schemas/index.ts` - Auto-generated Zod schemas from OpenAPI
   - `web/src/modules/**/types.ts` - Module-specific type definitions

4. **Page Components** (Where data is consumed)
   - `web/src/app/(home)/page.tsx` - Uses tRPC (`trpc.home.getManyLikePhotos`)
   - `web/src/app/(home)/travel/page.tsx` - Uses tRPC (`trpc.travel.getCitySets`)
   - `web/src/app/(home)/travel/[city]/page.tsx` - Uses tRPC (`trpc.travel.getOne`)
   - `web/src/app/(dashboard)/dashboard/page.tsx` - Uses tRPC for dashboard stats

5. **Module Views** (Client components consuming data)
   - `web/src/modules/home/ui/views/slider-view.tsx` - Uses tRPC hooks
   - `web/src/modules/travel/ui/views/travel-view.tsx` - Uses tRPC hooks
   - `web/src/modules/**/ui/views/*.tsx` - All view components

**Current Architecture:**
- **Dual System**: Template uses both tRPC (legacy) AND generated hooks/actions (new)
- **Base URL**: `https://safar.mulverse.com` (configurable via `NEXT_PUBLIC_API_URL`)
- **Data Flow**: 
  - Server Components → tRPC server calls OR Generated Server Actions
  - Client Components → tRPC client hooks OR Generated React Query hooks
- **Authentication**: Bearer token via `web/src/lib/auth/client.ts`

---

## 4. Step-by-Step Replacement Plan

### 1. Create the missing pages in the template file, following Next.js 16 best practices and the best structure for the project.

**Action Items:**

1. **Audit existing pages:**
   - Check `web/src/app/**/page.tsx` for all route pages
   - Identify missing pages based on your backend API endpoints
   - Document which pages need to be created

2. **Create missing pages following Next.js 16 App Router patterns:**
   ```typescript
   // Example: web/src/app/(home)/listings/page.tsx
   import { Suspense } from "react"
   import { getGuidesApiV1TravelGuidesGet } from '@/generated/actions/travelGuides'
   import { TravelGuidesView, LoadingStatus } from '@/modules/listings/ui/views/listings-view'
   
   export default async function ListingsPage() {
     const guides = await getGuidesApiV1TravelGuidesGet({ query: { limit: 20 } })
     
     return (
       <Suspense fallback={<LoadingStatus />}>
         <TravelGuidesView initialData={guides} />
       </Suspense>
     )
   }
   ```

3. **Pages to potentially create:**
   - `/listings` - If your backend has a listings endpoint
   - `/listings/[id]` - Individual listing detail page
   - `/bookings` - User bookings page
   - `/bookings/[id]` - Booking detail page
   - `/reviews` - Reviews management page
   - `/wishlist` - User wishlist page
   - Any other pages your backend API supports

4. **Follow Next.js 16 best practices:**
   - Use Server Components by default (`async` functions)
   - Use `Suspense` boundaries for loading states
   - Use `ErrorBoundary` for error handling
   - Implement proper `metadata` exports for SEO
   - Use route groups `(home)`, `(dashboard)` for layout organization

---

### 2. Replace all programmed/dummy data with real API calls (following Next.js 16 best practices).

**Action Items:**

1. **Find all dummy/mock data:**
   ```bash
   # Search for common patterns
   grep -r "mockData\|MOCK_\|sampleData\|dummyData\|fakeData\|const.*=.*\[.*\]" web/src --include="*.tsx" --include="*.ts"
   ```

2. **Replace tRPC calls with Generated Actions/Hooks:**
   - **Server Components** (`page.tsx`): Replace `trpc.*` with `await getGuidesApiV1TravelGuidesGet()` from `@/generated/actions/*`
   - **Client Components**: Replace `useTRPC()` with `useGetGuidesApiV1TravelGuidesGet()` from `@/generated/hooks/*`

3. **Update specific files:**
   - `web/src/app/(home)/page.tsx` - Replace `trpc.home.getManyLikePhotos` with generated action
   - `web/src/app/(home)/travel/page.tsx` - Replace `trpc.travel.getCitySets` with generated action
   - `web/src/modules/home/ui/views/slider-view.tsx` - Replace tRPC hook with generated hook
   - `web/src/modules/travel/ui/views/travel-view.tsx` - Replace tRPC hook with generated hook
   - All other view components using tRPC

4. **Pattern to follow:**
   ```typescript
   // OLD (tRPC)
   const trpc = useTRPC()
   const { data } = useSuspenseQuery(trpc.home.getManyLikePhotos.queryOptions({ limit: 10 }))
   
   // NEW (Generated Hooks)
   import { useGetGuidesApiV1TravelGuidesGet } from '@/generated/hooks/travelGuides'
   const { data } = useGetGuidesApiV1TravelGuidesGet(undefined, undefined, undefined, undefined, undefined, undefined, undefined, 0, 10, undefined)
   ```

5. **Handle loading and error states:**
   - Use `Suspense` boundaries in Server Components
   - Use `useSuspenseQuery` in Client Components
   - Add proper error boundaries

---

### 3. Update all server components (page.tsx, layout.tsx) to use the generated code.

**Action Items:**

1. **Update all `page.tsx` files:**
   - Remove tRPC imports: `import { trpc } from "@/trpc/server"`
   - Add generated action imports: `import { getGuidesApiV1TravelGuidesGet } from '@/generated/actions/travelGuides'`
   - Replace `trpc.*.queryOptions()` with direct `await` calls to generated actions
   - Remove `getQueryClient()` and `HydrationBoundary` if not needed (or keep for client components)

2. **Files to update:**
   - `web/src/app/(home)/page.tsx`
   - `web/src/app/(home)/travel/page.tsx`
   - `web/src/app/(home)/travel/[city]/page.tsx`
   - `web/src/app/(home)/discover/page.tsx`
   - `web/src/app/(home)/blog/page.tsx`
   - `web/src/app/(home)/blog/[slug]/page.tsx`
   - `web/src/app/(dashboard)/dashboard/page.tsx`
   - `web/src/app/(dashboard)/dashboard/photos/page.tsx`
   - `web/src/app/(dashboard)/dashboard/posts/page.tsx`
   - All other page components

3. **Pattern to follow:**
   ```typescript
   // OLD
   const queryClient = getQueryClient()
   void queryClient.prefetchQuery(trpc.home.getManyLikePhotos.queryOptions({ limit: 10 }))
   return <HydrationBoundary state={dehydrate(queryClient)}>...</HydrationBoundary>
   
   // NEW
   import { getGuidesApiV1TravelGuidesGet } from '@/generated/actions/travelGuides'
   
   export default async function Page() {
     const guides = await getGuidesApiV1TravelGuidesGet({ query: { limit: 10 } })
     return <GuidesView initialData={guides} />
   }
   ```

4. **Update `layout.tsx` files:**
   - Check if layouts need data fetching
   - Update to use generated actions if needed
   - Ensure proper error boundaries

---

### 4. Fix all types (create new types.ts files that match the backend UI).

**Action Items:**

1. **Audit current type usage:**
   - Check `web/src/generated/schemas/index.ts` - These are auto-generated from OpenAPI
   - Check `web/src/modules/**/types.ts` - Module-specific types that may need updating
   - Identify type mismatches between template and your backend

2. **Create type mappers (if backend structure differs):**
   ```typescript
   // web/src/lib/types/mappers.ts
   import { GetGuidesApiV1TravelGuidesGetResponseSchema } from '@/generated/schemas'
   import type { z } from 'zod'
   
   // If your backend returns different structure, create mapper
   export function mapBackendGuideToTemplate(backend: YourBackendGuide): z.infer<typeof GetGuidesApiV1TravelGuidesGetResponseSchema> {
     return {
       id: backend.guide_id,
       title: backend.guide_title,
       description: backend.guide_description,
       // Map all fields according to your backend structure
     }
   }
   ```

3. **Update module-specific types:**
   - `web/src/modules/travel/types.ts` - Update to match backend response
   - `web/src/modules/posts/types.ts` - Update if needed
   - `web/src/modules/photos/types.ts` - Update if needed
   - `web/src/modules/discover/types.ts` - Update if needed
   - `web/src/modules/blog/types.ts` - Update if needed
   - `web/src/modules/dashboard/types.ts` - Update if needed

4. **Create backend-specific types file (if needed):**
   ```typescript
   // web/src/lib/types/backend.ts
   export interface BackendGuide {
     guide_id: string
     guide_title: string
     guide_description: string
     // Your actual backend structure
   }
   ```

5. **Regenerate schemas (if using OpenAPI):**
   - If you have an updated OpenAPI spec, regenerate: `npm run generate` (or your generation command)
   - This will update `web/src/generated/schemas/index.ts` automatically

---

### 5. Update search and filters to match my query parameters, following best practices.

**Action Items:**

1. **Check current search/filter implementation:**
   - Review `web/src/generated/actions/search.ts`
   - Review `web/src/generated/actions/travelGuides.ts` - Check `GetGuidesApiV1TravelGuidesGetParamsSchema`
   - Review `web/src/generated/actions/listings.ts` - Check query parameters

2. **Map query parameters:**
   ```typescript
   // Example: web/src/lib/utils/query-mapper.ts
   export function mapSearchParamsToBackend(templateParams: {
     city?: string
     price_min?: number
     price_max?: number
     listing_type?: string
   }) {
     return {
       city_name: templateParams.city,
       min_price: templateParams.price_min,
       max_price: templateParams.price_max,
       property_type: templateParams.listing_type,
       // Map according to your backend API
     }
   }
   ```

3. **Update search components:**
   - Find search/filter components: `web/src/components/search/**/*.tsx`
   - Find filter hooks: `web/src/modules/**/hooks/use-*-filters.ts`
   - Update to use correct parameter names from your backend

4. **Update generated hooks usage:**
   ```typescript
   // OLD
   useGetGuidesApiV1TravelGuidesGet(city, country, city, tags, category, is_official, status, skip, limit, sort_by)
   
   // NEW (with mapped params)
   const backendParams = mapSearchParamsToBackend({ city, price_min, price_max })
   useGetGuidesApiV1TravelGuidesGet(
     backendParams.city_name,
     backendParams.country_code,
     // ... other mapped params
   )
   ```

5. **Update URL search params handling:**
   - Check if using `nuqs` or Next.js `searchParams`
   - Ensure query parameters match your backend API expectations
   - Update `web/src/generated/hooks/travelGuides.ts` - Check `searchParamsParser` if present

---

### 6. Update image processing (the backend UI is returning a different structure).

**Action Items:**

1. **Identify current image structure:**
   - Search for image access patterns: `grep -r "\.photos\|\.images\|\.url" web/src --include="*.tsx"`
   - Check how images are currently accessed in components

2. **Create image mapper utility:**
   ```typescript
   // web/src/lib/utils/image-mapper.ts
   export function getImageUrl(item: any, index = 0): string {
     // Handle multiple possible structures
     if (item.media?.[index]?.file_url) return item.media[index].file_url
     if (item.photos?.[index]?.url) return item.photos[index].url
     if (item.images?.[index]?.url) return item.images[index].url
     if (item.photo_url) return item.photo_url
     if (item.image_url) return item.image_url
     return '/placeholder.jpg' // Fallback
   }
   
   export function getAllImages(item: any): string[] {
     if (item.media?.length) return item.media.map((m: any) => m.file_url)
     if (item.photos?.length) return item.photos.map((p: any) => p.url)
     if (item.images?.length) return item.images.map((i: any) => i.url)
     return []
   }
   ```

3. **Update all image components:**
   - `web/src/components/blur-image.tsx` - Check image source
   - `web/src/components/photo-carousel.tsx` - Update image access
   - `web/src/modules/**/ui/components/*.tsx` - All components using images
   - Replace direct access with `getImageUrl()` utility

4. **Update image upload (if applicable):**
   - Check `web/src/generated/actions/files.ts`
   - Check `web/src/generated/hooks/useUploadFile.ts`
   - Ensure upload response structure matches your backend
   - Update `web/src/modules/photos/hooks/use-photo-upload.ts` if needed

5. **Update image display components:**
   ```typescript
   // OLD
   <img src={listing.photos[0].url} />
   
   // NEW
   import { getImageUrl } from '@/lib/utils/image-mapper'
   <img src={getImageUrl(listing)} />
   ```

---

### 7. Fix dates (check if the template uses date | string | ISO).

**Action Items:**

1. **Audit date usage:**
   - Check `web/src/generated/schemas/index.ts` - Look for date fields (search for `date`, `Date`, `ISO`)
   - Check how dates are used in components: `grep -r "check_in\|check_out\|created_at\|updated_at" web/src --include="*.tsx"`

2. **Create date utility:**
   ```typescript
   // web/src/lib/utils/dates.ts
   export function parseBackendDate(date: string | Date | null | undefined): Date {
     if (!date) return new Date()
     if (date instanceof Date) return date
     // Handle ISO strings, timestamps, etc.
     return new Date(date)
   }
   
   export function formatDateForBackend(date: Date): string {
     // Return format your backend expects (ISO, YYYY-MM-DD, etc.)
     return date.toISOString().split('T')[0] // YYYY-MM-DD
   }
   
   export function formatDateForDisplay(date: Date | string): string {
     const d = parseBackendDate(date)
     return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
   }
   ```

3. **Update date fields in components:**
   - Booking forms: `check_in`, `check_out` dates
   - Listing cards: `created_at`, `updated_at` display
   - Filters: Date range filters
   - All date pickers and displays

4. **Update date handling in actions:**
   - Check `web/src/generated/actions/bookings.ts` - Ensure dates are formatted correctly
   - Check `web/src/generated/actions/travelGuides.ts` - Date fields if any
   - Transform dates when sending to backend and when receiving from backend

5. **Update date types:**
   - Ensure TypeScript types match (string vs Date)
   - Update schemas if dates are returned as strings but used as Date objects

---

## 5. Prioritize files to modify first (order of priority)

### Top 10 Files to Change First:

1. **`web/src/generated/client/base.ts`** (Line 273)
   - **Priority**: CRITICAL
   - **Action**: Update `NEXT_PUBLIC_API_URL` environment variable to your backend URL
   - **Time**: 2 minutes

2. **`.env.local`** (Create if missing)
   - **Priority**: CRITICAL
   - **Action**: Set `NEXT_PUBLIC_API_URL=https://your-real-api.com`
   - **Time**: 1 minute

3. **`web/src/app/(home)/page.tsx`**
   - **Priority**: HIGH
   - **Action**: Replace tRPC calls with generated actions, update data fetching
   - **Time**: 30 minutes

4. **`web/src/modules/home/ui/views/slider-view.tsx`**
   - **Priority**: HIGH
   - **Action**: Replace tRPC hook with generated hook, fix image access
   - **Time**: 20 minutes

5. **`web/src/app/(home)/travel/page.tsx`**
   - **Priority**: HIGH
   - **Action**: Replace tRPC with generated actions
   - **Time**: 20 minutes

6. **`web/src/modules/travel/ui/views/travel-view.tsx`**
   - **Priority**: HIGH
   - **Action**: Replace tRPC hook with generated hook
   - **Time**: 20 minutes

7. **`web/src/generated/actions/travelGuides.ts`**
   - **Priority**: HIGH
   - **Action**: Verify field mappings, update if backend structure differs
   - **Time**: 30 minutes

8. **`web/src/lib/utils/image-mapper.ts`** (Create new)
   - **Priority**: MEDIUM-HIGH
   - **Action**: Create utility to handle different image structures
   - **Time**: 15 minutes

9. **`web/src/lib/utils/dates.ts`** (Create new)
   - **Priority**: MEDIUM-HIGH
   - **Action**: Create date parsing/formatting utilities
   - **Time**: 15 minutes

10. **`web/src/modules/travel/types.ts`**
    - **Priority**: MEDIUM
    - **Action**: Update types to match your backend response structure
    - **Time**: 20 minutes

**Additional High-Priority Files (11-15):**

11. **`web/src/app/(home)/travel/[city]/page.tsx`** - Replace tRPC, fix dynamic route
12. **`web/src/app/(dashboard)/dashboard/page.tsx`** - Replace tRPC calls
13. **`web/src/generated/actions/listings.ts`** - Verify and update field mappings
14. **`web/src/generated/actions/bookings.ts`** - Fix date formats, field mappings
15. **`web/src/generated/actions/search.ts`** - Update query parameters

---

## 8. Estimated time

### Actual time to fully adapt the template: **3-4 working days (24-32 hours)**

**Breakdown for an experienced Next.js developer:**

| Phase | Task | Time Estimate |
|-------|------|---------------|
| **Phase 1: Setup** | Update base URL, env vars | 15 min |
| | Verify API connectivity | 15 min |
| **Phase 2: Core Data Fetching** | Replace tRPC in all page.tsx files (10+ files) | 3 hours |
| | Replace tRPC in all view components (15+ files) | 2.5 hours |
| | Update generated actions field mappings | 2 hours |
| **Phase 3: Types & Schemas** | Create/update type mappers | 1.5 hours |
| | Update module-specific types | 1.5 hours |
| | Fix TypeScript errors | 1.5 hours |
| **Phase 4: Image Handling** | Create image mapper utility | 30 min |
| | Update all image components (20+ files) | 2 hours |
| **Phase 5: Date Handling** | Create date utilities | 30 min |
| | Update date fields in forms/components | 1.5 hours |
| **Phase 6: Search & Filters** | Update query parameters | 1.5 hours |
| | Update search/filter components | 2 hours |
| **Phase 7: Missing Pages** | Create missing pages (if needed) | 2 hours |
| **Phase 8: Testing & Debugging** | Fix field mapping issues | 2 hours |
| | Fix image loading issues | 1 hour |
| | Fix date format issues | 1 hour |
| | End-to-end testing | 2 hours |
| **Phase 9: Polish** | Error handling improvements | 1 hour |
| | Loading states | 30 min |
| | Edge case fixes | 1 hour |

**Total: 24-32 hours (3-4 working days)**

**Factors that may increase time:**
- Complex field transformations (+2-4 hours)
- Significant API structure differences (+4-8 hours)
- Many missing pages to create (+2-4 hours)
- Extensive tRPC to generated code migration (+2-4 hours)

**Factors that may decrease time:**
- Backend closely matches generated schemas (-4-6 hours)
- Simple field name changes only (-2-4 hours)
- Automated find/replace for common patterns (-1-2 hours)

---