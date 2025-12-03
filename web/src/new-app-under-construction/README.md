# New App Router Structure

This is the improved Next.js 16 App Router structure based on the improvements document.

## Structure Overview

### Public Routes
- `/` - Homepage
- `/listings` - Browse listings
- `/listings/[slug]` - Listing detail
- `/search` - Search results
- `/travel-guides` - Travel guides
- `/travel-guides/[slug]` - Guide detail
- `/travel-guides/stories` - User stories
- `/travel-guides/stories/[slug]` - Story detail

### Authentication Routes
- `/auth/login` - Login
- `/auth/register` - Register
- `/auth/verify-email` - Email verification
- `/auth/reset-password` - Password reset
- `/auth/oauth/callback` - OAuth callback

### Protected App Routes (`(app)` group)
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/profile/edit` - Edit profile
- `/profile/settings/*` - Settings pages
- `/bookings` - My bookings
- `/bookings/[id]` - Booking detail
- `/wishlist` - Wishlist
- `/messages` - Messages
- `/messages/[conversationId]` - Conversation
- `/reviews` - My reviews
- `/reviews/write` - Write review
- `/travel-plans` - Travel plans
- `/travel-plans/new` - Create plan
- `/travel-plans/[id]` - Plan detail
- `/loyalty` - Loyalty program
- `/loyalty/history` - Points history
- `/notifications` - Notifications
- `/subscriptions` - Subscriptions
- `/subscriptions/plans` - Subscription plans

### Host Routes (`(app)/host`)
- `/host` - Host dashboard
- `/host/listings` - My listings
- `/host/listings/new` - Create listing
- `/host/listings/[id]` - Listing management
- `/host/listings/[id]/edit` - Edit listing
- `/host/listings/[id]/manage` - Manage listing
- `/host/bookings` - Host bookings
- `/host/bookings/[id]` - Booking detail
- `/host/analytics` - Analytics
- `/host/promotions` - Promotions
- `/host/promotions/create` - Create coupon

## Key Features

1. **Server Components by Default** - All pages are Server Components
2. **Async Params** - Using `Promise<{ slug: string }>` pattern
3. **Loading States** - Each route has `loading.tsx`
4. **Error Boundaries** - `error.tsx` for error handling
5. **Not Found Pages** - `not-found.tsx` for 404s
6. **Metadata** - Dynamic metadata generation
7. **Suspense** - Streaming with Suspense boundaries
8. **Type Safety** - TypeScript throughout

## Next Steps

1. Create the supporting files in `lib/server/queries/` for data fetching
2. Create the components referenced in the pages
3. Implement the API client in `lib/api/client.ts`
4. Add middleware for route protection
5. Create Server Actions in `lib/server/actions/`

## Old Files

The previous app structure has been moved to `old-app/` for reference.

