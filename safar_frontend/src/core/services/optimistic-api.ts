// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { api } from "./api"
// import type { PaginatedResponse, Wishlist, Review, Booking, Notification, Message } from "@/core/types"


// export type OptimisticUpdateOptions<T, A> = {
//   queryName: string
//   queryArgs?: any
//   updateDraft: (draft: PaginatedResponse<T>, args: A) => void
//   onSuccess?: (response: any, draft: PaginatedResponse<T>, args: A) => void
// }

// export const performOptimisticUpdate = <T, A>(
//   options: OptimisticUpdateOptions<T, A>,
//   args: A,
//   dispatch: any,
//   queryFulfilled: Promise<any>,
// ) => {
//   const { queryName, queryArgs = {}, updateDraft, onSuccess } = options

//   const patchResult = dispatch(
//     api.util.updateQueryData(queryName, queryArgs, (draft: PaginatedResponse<T>) => {
//       updateDraft(draft, args)
//     }),
//   )

//   queryFulfilled
//     .then((response) => {
//       if (onSuccess) {
//         dispatch(
//           api.util.updateQueryData(queryName, queryArgs, (draft: PaginatedResponse<T>) => {
//             onSuccess(response.data, draft, args)
//           }),
//         )
//       }
//     })
//     .catch(() => {

//       patchResult.undo()
//     })
// }

// export const extendedApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     addToWishlistOptimistic: builder.mutation<Wishlist, Partial<Wishlist>>({
//       query: (body) => ({
//         url: "/wishlists/",
//         method: "POST",
//         body,
//       }),
//       async onQueryStarted(wishlistItem, { dispatch, queryFulfilled }) {
//         const tempId = `temp-${Date.now()}`

//         performOptimisticUpdate<Wishlist, Partial<Wishlist>>(
//           {
//             queryName: "getUserWishlist",
//             queryArgs: {},
//             updateDraft: (draft, args) => {
//               draft.results.unshift({
//                 id: tempId,
//                 ...args,
//                 created_at: new Date().toISOString(),
//               } as Wishlist)
//               draft.count = (draft.count || 0) + 1
//             },
//             onSuccess: (response, draft) => {
//               const index = draft.results.findIndex((item) => item.id === tempId)
//               if (index !== -1) {
//                 draft.results[index] = response
//               }
//             },
//           },
//           wishlistItem,
//           dispatch,
//           queryFulfilled,
//         )
//       },
//       invalidatesTags: ["Wishlist"],
//     }),

//     removeFromWishlistOptimistic: builder.mutation<void, string>({
//       query: (id) => ({
//         url: `/wishlists/${id}/`,
//         method: "DELETE",
//       }),
//       async onQueryStarted(id, { dispatch, queryFulfilled }) {
//         performOptimisticUpdate<Wishlist, string>(
//           {
//             queryName: "getUserWishlist",
//             queryArgs: {},
//             updateDraft: (draft, itemId) => {
//               const index = draft.results.findIndex((item) => item.id === itemId)
//               if (index !== -1) {
//                 draft.results.splice(index, 1)
//                 draft.count = Math.max(0, (draft.count || 0) - 1)
//               }
//             },
//           },
//           id,
//           dispatch,
//           queryFulfilled,
//         )
//       },
//       invalidatesTags: ["Wishlist"],
//     }),

//     createReviewOptimistic: builder.mutation<Review, Partial<Review>>({
//       query: (body) => ({
//         url: "/reviews/",
//         method: "POST",
//         body,
//       }),
//       async onQueryStarted(review, { dispatch, queryFulfilled, getState }) {
//         const tempId = `temp-${Date.now()}`
//         const state = getState() as any
//         const currentUser = state.auth.user

//         // Determine query parameters based on review type
//         const queryArgs = {
//           d: review.place,
//         }

//         performOptimisticUpdate<Review, Partial<Review>>(
//           {
//             queryName: "getReviews",
//             queryArgs,
//             updateDraft: (draft, args) => {
//               // Add optimistic review
//               draft.results.unshift({
//                 id: tempId,
//                 ...args,
//                 created_at: new Date().toISOString(),
//                 user: currentUser || { id: "current-user" },
//               } as Review)
//               draft.count = (draft.count || 0) + 1
//             },
//             onSuccess: (response, draft) => {
//               // Replace temp review with real one
//               const index = draft.results.findIndex((r) => r.id === tempId)
//               if (index !== -1) {
//                 draft.results[index] = response
//               }
//             },
//           },
//           review,
//           dispatch,
//           queryFulfilled,
//         )
//       },
//       invalidatesTags: ["Review"],
//     }),

//     // Optimistic booking operations
//     createBookingOptimistic: builder.mutation<Booking, Partial<Booking>>({
//       query: (body) => ({
//         url: "/bookings/",
//         method: "POST",
//         body,
//       }),
//       async onQueryStarted(booking, { dispatch, queryFulfilled, getState }) {
//         const tempId = `temp-${Date.now()}`
//         const state = getState() as any
//         const currentUser = state.auth.user

//         performOptimisticUpdate<Booking, Partial<Booking>>(
//           {
//             queryName: "getBookings",
//             queryArgs: { status: "pending" },
//             updateDraft: (draft, args) => {
//               draft.results.unshift({
//                   id: tempId,
//                   ...args,
//                   created_at: new Date().toISOString(),
//                   status: "pending",
//                   total_price: 0,
//                   user: currentUser || { id: "current-user" },
//               } as unknown as Booking)
//               draft.count = (draft.count || 0) + 1
//             },
//             onSuccess: (response, draft) => {
//               const index = draft.results.findIndex((b) => b.id === tempId)
//               if (index !== -1) {
//                 draft.results[index] = response
//               }
//             },
//           },
//           booking,
//           dispatch,
//           queryFulfilled,
//         )
//       },
//       invalidatesTags: ["Booking"],
//     }),

//     cancelBookingOptimistic: builder.mutation<Booking, string>({
//       query: (id) => ({
//         url: `/bookings/${id}/cancel/`,
//         method: "POST",
//       }),
//       async onQueryStarted(id, { dispatch, queryFulfilled }) {
//         performOptimisticUpdate<Booking, string>(
//           {
//             queryName: "getBookings",
//             queryArgs: { status: "confirmed" },
//             updateDraft: (draft, bookingId) => {
//               const index = draft.results.findIndex((b) => b.id === bookingId)
//               if (index !== -1) {
//                 draft.results[index] = {
//                   ...draft.results[index],
//                   status: "Cancelled",
//                 }
//               }
//             },
//           },
//           id,
//           dispatch,
//           queryFulfilled,
//         )
//       },
//       invalidatesTags: ["Booking"],
//     }),

//      markNotificationAsReadOptimistic: builder.mutation<Notification, string>({
//       query: (id) => ({
//         url: `/notifications/${id}/mark_as_read/`,
//         method: "POST",
//       }),
//       async onQueryStarted(id, { dispatch, queryFulfilled }) {
//         performOptimisticUpdate<Notification, string>(
//           {
//             queryName: "getNotifications",
//             queryArgs: {},
//             updateDraft: (draft, notificationId) => {
//               const index = draft.results.findIndex((n) => n.id === notificationId)
//               if (index !== -1) {
//                 draft.results[index] = {
//                   ...draft.results[index],
//                   is_read: true,
//                 }
//               }
//             },
//           },
//           id,
//           dispatch,
//           queryFulfilled,
//         )

//         // Also update unread notifications
//         performOptimisticUpdate<Notification, string>(
//           {
//             queryName: "getUnreadNotifications",
//             queryArgs: {},
//             updateDraft: (draft, notificationId) => {
//               // Remove from unread list
//               const index = draft.results.findIndex((n) => n.id === notificationId)
//               if (index !== -1) {
//                 draft.results.splice(index, 1)
//                 draft.count = Math.max(0, (draft.count || 0) - 1)
//               }
//             },
//           },
//           id,
//           dispatch,
//           queryFulfilled,
//         )
//       },
//       invalidatesTags: ["Notification"],
//     }),

//     // Optimistic message operations
//     markMessageAsReadOptimistic: builder.mutation<Message, string>({
//       query: (id) => ({
//         url: `/messages/${id}/mark_as_read/`,
//         method: "POST",
//       }),
//       async onQueryStarted(id, { dispatch, queryFulfilled }) {
//         performOptimisticUpdate<Message, string>(
//           {
//             queryName: "getMessages",
//             queryArgs: {},
//             updateDraft: (draft, messageId) => {
//               // Find and mark message as read
//               const index = draft.results.findIndex((m) => m.id === messageId)
//               if (index !== -1) {
//                 draft.results[index] = {
//                   ...draft.results[index],
//                   is_read: true,
//                 }
//               }
//             },
//           },
//           id,
//           dispatch,
//           queryFulfilled,
//         )

//         performOptimisticUpdate<Message, string>(
//           {
//             queryName: "getUnreadMessages",
//             queryArgs: {},
//             updateDraft: (draft, messageId) => {
//               const index = draft.results.findIndex((m) => m.id === messageId)
//               if (index !== -1) {
//                 draft.results.splice(index, 1)
//                 draft.count = Math.max(0, (draft.count || 0) - 1)
//               }
//             },
//           },
//           id,
//           dispatch,
//           queryFulfilled,
//         )
//       },
//       invalidatesTags: ["Message"],
//     }),
//   }),
//   overrideExisting: false,
// })


// export const {
//   useAddToWishlistOptimisticMutation,
//   useRemoveFromWishlistOptimisticMutation,
//   useCreateReviewOptimisticMutation,
//   useCreateBookingOptimisticMutation,
//   useCancelBookingOptimisticMutation,
//   useMarkNotificationAsReadOptimisticMutation,
//   useMarkMessageAsReadOptimisticMutation,
// } = extendedApi
