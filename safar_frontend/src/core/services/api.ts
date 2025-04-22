/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseQueryFn, createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import type {
  Category,
  Discount,
  Place,
  Experience,
  Flight,
  Box,
  Booking,
  Wishlist,
  Review,
  Payment,
  Message,
  Notification,
  LoginResponse,
  User,
  PaginatedResponse,
  InteractionType,
  UserInteraction
} from '@/core/types';
import { setTokens, logout } from "@/core/features/auth/auth-slice";
import type { RootState } from "@/core/store";

const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
  baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api`,
  credentials: "include",
  prepareHeaders: (headers, { getState, arg }) => {
    const state = getState() as RootState
    const token = state.auth.accessToken

    const url = typeof arg === "object" && "url" in arg ? arg.url : undefined;
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (apiKey && url && !url.startsWith("/auth/")) {
      headers.set("Authorization", `Api-Key ${apiKey}`);
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (typeof document !== "undefined") {
      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="))
        ?.split("=")[1]

      if (csrfToken) {
        headers.set("X-CSRFToken", csrfToken)
      }
    }

    return headers
  },
})

const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  console.log('Starting request', args.url);
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);
  console.log('Initial request result', result);

  if (result.error?.status === 401) {
    console.log('401 error detected, attempting refresh');
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const state = api.getState() as RootState;
        const refreshToken = state.auth.refreshToken;
        console.log('Current refresh token', refreshToken);

        if (refreshToken) {
          const refreshResult = await baseQuery(
            { 
              url: "/auth/jwt/refresh/", 
              method: "POST", 
              body: { refresh: refreshToken } 
            },
            api,
            extraOptions,
          );
          console.log('Refresh result', refreshResult);

          if (refreshResult.data) {
            api.dispatch(setTokens({
              access: (refreshResult.data as { access: string }).access,
              refresh: refreshToken
            }));
            console.log('Tokens updated, retrying original request');
            result = await baseQuery(args, api, extraOptions);
          } else {
            console.log('Refresh failed, logging out');
            api.dispatch(logout());
          }
        } else {
          console.log('No refresh token available, logging out');
          api.dispatch(logout());
        }
      } finally {
        release();
      }
    } else {
      console.log('Mutex locked, waiting...');
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  if (result.error?.status === 403) {
    console.log('403 error detected, logging out');
    api.dispatch(logout());
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Category',
    'Discount',
    'Place',
    'Experience',
    'Flight',
    'Box',
    'Booking',
    'Wishlist',
    'Review',
    'Payment',
    'Message',
    'Notification',
    'Auth',
    'UserInteraction'
  ],
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: (credentials) => ({
        url: "/auth/jwt/create/",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),
      
    register: builder.mutation<User, Partial<User>>({
      query: (userData) => ({
        url: "/auth/users/",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Auth"],
    }),
      
    verifyEmail: builder.mutation<void, { uid: string; token: string }>({
      query: ({ uid, token }) => ({
        url: "/auth/users/activation/",
        method: "POST",
        body: { uid, token },
      }),
      invalidatesTags: ["Auth"],
    }),
      
    resendActivationEmail: builder.mutation<void, { email: string }>({
      query: (email) => ({
        url: "/auth/users/resend_activation/",
        method: "POST",
        body: email,
      }),
    }),
      
    requestPasswordReset: builder.mutation<void, { email: string }>({
      query: (email) => ({
        url: "/auth/users/reset_password/",
        method: "POST",
        body: email,
      }),
    }),
      
    confirmPasswordReset: builder.mutation<void, { uid: string; token: string; new_password: string }>({
      query: (data) => ({
        url: "/auth/users/reset_password_confirm/",
        method: "POST",
        body: data,
      }),
    }),
      
    refreshToken: builder.mutation<{ access: string }, { refresh: string }>({
      query: (data) => ({
        url: "/auth/jwt/refresh/",
        method: "POST",
        body: data,
      }),
    }),
      
    verifyToken: builder.mutation<void, { token: string }>({
      query: (token) => ({
        url: '/auth/jwt/verify/',
        method: 'POST',
        body: token,
      }),
    }),
      
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout/",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),
      
    getUser: builder.query<User, void>({
      query: () => ({
        url: "/auth/users/me/",
      }),
      providesTags: ["Auth"],
    }),
      
    updateUser: builder.mutation<User, Partial<User>>({
      query: (userData) => ({
        url: "/auth/users/me/",
        method: "PATCH",
        body: userData,
      }),
      invalidatesTags: ["Auth"],
    }),
      
    deleteUser: builder.mutation<void, { current_password: string }>({
      query: (data) => ({
        url: '/auth/users/me/',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['Auth'],
    }),
      
    socialAuth: builder.mutation<LoginResponse, { provider: string; code: string }>({
      query: ({ provider, code }) => ({
        url: `/auth/o/${provider}/`,
        method: "POST",
        body: { code },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["Auth"],
    }),

    // User Interactions endpoints
    getUserInteractions: builder.query<PaginatedResponse<UserInteraction>, { 
      page?: number; 
      page_size?: number;
      interaction_type?: InteractionType;
      content_type?: string;
    }>({
      query: (params) => ({
        url: '/interactions/',
        params
      }),
      providesTags: ['UserInteraction']
    }),
      
    getUserInteraction: builder.query<UserInteraction, string>({
      query: (id) => `/interactions/${id}/`,
      providesTags: (result, error, id) => [{ type: 'UserInteraction', id }]
    }),
      
    createUserInteraction: builder.mutation<UserInteraction, Partial<UserInteraction>>({
      query: (body) => ({
        url: '/interactions/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['UserInteraction']
    }),
      
    logInteraction: builder.mutation<UserInteraction, {
      content_type: string;
      object_id: string;
      interaction_type: InteractionType;
      metadata?: Record<string, any>;
      device_type?: 'mobile' | 'desktop' | 'tablet';
    }>({
      query: (body) => ({
        url: '/interactions/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['UserInteraction']
    }),

    // Category endpoints
    getCategories: builder.query<PaginatedResponse<Category>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/categories/',
        params
      }),
      providesTags: ['Category']
    }),
    getCategory: builder.query<Category, string>({
      query: (id) => `/categories/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Category', id }]
    }),

    createCategory: builder.mutation<Category, Partial<Category>>({
      query: (body) => ({
        url: '/categories/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Category']
    }),
    updateCategory: builder.mutation<Category, Partial<Category> & { id: string }>({
      query: ({ id, ...patch }) => ({
        url: `/categories/${id}/`,
        method: 'PATCH',
        body: patch
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Category', id }]
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/categories/${id}/`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Category', id }]
    }),

    // Discount endpoints
    getDiscounts: builder.query<PaginatedResponse<Discount>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/discounts/',
        params
      }),
      providesTags: ['Discount']
    }),
    getActiveDiscounts: builder.query<PaginatedResponse<Discount>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/discounts/active/',
        params
      }),
      providesTags: ['Discount']
    }),
    getDiscount: builder.query<Discount, string>({
      query: (id) => `/discounts/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Discount', id }]
    }),
    createDiscount: builder.mutation<Discount, Partial<Discount>>({
      query: (body) => ({
        url: '/discounts/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Discount']
    }),
    applyDiscount: builder.mutation<Discount, { id: string; booking_id: string }>({
      query: ({ id, booking_id }) => ({
        url: `/discounts/${id}/apply/`,
        method: 'POST',
        body: { booking_id }
      }),
      invalidatesTags: ['Discount', 'Booking']
    }),

    // Place endpoints
    getPlaces: builder.query<PaginatedResponse<Place>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/places/',
        params
      }),
      providesTags: ['Place']
    }),
    
    getSimilarPlaces: builder.query<PaginatedResponse<Place>, { id: string; page?: number; page_size?: number }>({
      query: ({ id, ...params }) => ({
        url: `/places/${id}/similar/`,
        params
      }),
      providesTags: (result, error, { id }) => [{ type: 'Place', id }]
    }),
    getPlace: builder.query<Place, string>({
      query: (id) => `/places/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Place', id }]
    }),
    createPlace: builder.mutation<Place, Partial<Place>>({
      query: (body) => ({
        url: '/places/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Place']
    }),
    updatePlace: builder.mutation<Place, Partial<Place> & { id: string }>({
      query: ({ id, ...patch }) => ({
        url: `/places/${id}/`,
        method: 'PATCH',
        body: patch
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Place', id }]
    }),
    deletePlace: builder.mutation<void, string>({
      query: (id) => ({
        url: `/places/${id}/`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Place', id }]
    }),

    // Experience endpoints
    getExperiences: builder.query<PaginatedResponse<Experience>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/experiences/',
        params
      }),
      providesTags: ['Experience']
    }),
    getExperience: builder.query<Experience, string>({
      query: (id) => `/experiences/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Experience', id }]
    }),
    checkExperienceAvailability: builder.query<
      { available: boolean; capacity: number },
      { id: string; date: string }
    >({
      query: ({ id, date }) => `/experiences/${id}/availability/?date=${date}`,
      providesTags: ['Experience']
    }),
    createExperience: builder.mutation<Experience, Partial<Experience>>({
      query: (body) => ({
        url: '/experiences/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Experience']
    }),
    updateExperience: builder.mutation<Experience, Partial<Experience> & { id: string }>({
      query: ({ id, ...patch }) => ({
        url: `/experiences/${id}/`,
        method: 'PATCH',
        body: patch
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Experience', id }]
    }),
    
    deleteExperience: builder.mutation<void, string>({
      query: (id) => ({
        url: `/experiences/${id}/`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Experience', id }]
    }),
    // Flight endpoints
    getFlights: builder.query<PaginatedResponse<Flight>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/flights/',
        params
      }),
      providesTags: ['Flight']
    }),
    searchFlights: builder.query<
      PaginatedResponse<Flight>,
      { departure?: string; arrival?: string; date?: string; page?: number; page_size?: number }
    >({
      query: (params) => ({
        url: '/flights/search/',
        params
      }),
      providesTags: ['Flight']
    }),
    getFlight: builder.query<Flight, string>({
      query: (id) => `/flights/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Flight', id }]
    }),

    // Box endpoints
    getBoxes: builder.query<PaginatedResponse<Box>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/boxes/',
        params
      }),
      providesTags: ['Box']
    }),
    getBox: builder.query<Box, string>({
      query: (id) => `/boxes/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Box', id }]
    }),
    getBoxItinerary: builder.query<{ itinerary: string }, string>({
      query: (id) => `/boxes/${id}/itinerary/`,
      providesTags: ['Box']
    }),
    createBox: builder.mutation<Box, Partial<Box>>({
      query: (body) => ({
        url: '/boxes/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Box']
    }),

    // Booking endpoints
    getBookings: builder.query<PaginatedResponse<Booking>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/bookings/',
        params
      }),
      providesTags: ['Booking']
    }),
    getUpcomingBookings: builder.query<PaginatedResponse<Booking>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/bookings/upcoming/',
        params
      }),
      providesTags: ['Booking']
    }),
    getBooking: builder.query<Booking, string>({
      query: (id) => `/bookings/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Booking', id }]
    }),
    createBooking: builder.mutation<Booking, Partial<Booking>>({
      query: (body) => ({
        url: '/bookings/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Booking']
    }),
    updateBooking: builder.mutation<Booking, Partial<Booking> & { id: string }>({
      query: ({ id, ...patch }) => ({
        url: `/bookings/${id}/`,
        method: 'PATCH',
        body: patch
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Booking', id }]
    }),
    confirmBooking: builder.mutation<Booking, string>({
      query: (id) => ({
        url: `/bookings/${id}/confirm/`,
        method: 'POST'
      }),
      invalidatesTags: ['Booking']
    }),
    cancelBooking: builder.mutation<Booking, string>({
      query: (id) => ({
        url: `/bookings/${id}/cancel/`,
        method: 'POST'
      }),
      invalidatesTags: ['Booking']
    }),

    // Wishlist endpoints
    getWishlists: builder.query<PaginatedResponse<Wishlist>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/wishlists/',
        params
      }),
      providesTags: ['Wishlist']
    }),
    getUserWishlist: builder.query<PaginatedResponse<Wishlist>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/wishlists/mine/',
        params
      }),
      providesTags: ['Wishlist']
    }),
    addToWishlist: builder.mutation<Wishlist, Partial<Wishlist>>({
      query: (body) => ({
        url: '/wishlists/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Wishlist']
    }),
    removeFromWishlist: builder.mutation<void, string>({
      query: (id) => ({
        url: `/wishlists/${id}/`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Wishlist']
    }),

    // Review endpoints
    getReviews: builder.query<PaginatedResponse<Review>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/reviews/',
        params
      }),
      providesTags: ['Review']
    }),
    getUserReviews: builder.query<PaginatedResponse<Review>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/reviews/my_reviews/',
        params
      }),
      providesTags: ['Review']
    }),
    createReview: builder.mutation<Review, Partial<Review>>({
      query: (body) => ({
        url: '/reviews/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Review']
    }),
    updateReview: builder.mutation<Review, Partial<Review> & { id: string }>({
      query: ({ id, ...patch }) => ({
        url: `/reviews/${id}/`,
        method: 'PATCH',
        body: patch
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Review', id }]
    }),

    // Payment endpoints
    getPayments: builder.query<PaginatedResponse<Payment>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/payments/',
        params
      }),
      providesTags: ['Payment']
    }),
    getPayment: builder.query<Payment, string>({
      query: (id) => `/payments/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Payment', id }]
    }),
    markPaymentAsPaid: builder.mutation<Payment, string>({
      query: (id) => ({
        url: `/payments/${id}/mark_as_paid/`,
        method: 'POST'
      }),
      invalidatesTags: ['Payment']
    }),

    // Message endpoints
    getMessages: builder.query<PaginatedResponse<Message>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/messages/',
        params
      }),
      providesTags: ['Message']
    }),
    getUnreadMessages: builder.query<PaginatedResponse<Message>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/messages/unread/',
        params
      }),
      providesTags: ['Message']
    }),
    sendMessage: builder.mutation<Message, Partial<Message>>({
      query: (body) => ({
        url: '/messages/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Message']
    }),
    markMessageAsRead: builder.mutation<Message, string>({
      query: (id) => ({
        url: `/messages/${id}/mark_as_read/`,
        method: 'POST'
      }),
      invalidatesTags: ['Message']
    }),

    // Notification endpoints
    getNotifications: builder.query<PaginatedResponse<Notification>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/notifications/',
        params
      }),
      providesTags: ['Notification']
    }),
    getUnreadNotifications: builder.query<PaginatedResponse<Notification>, { page?: number; page_size?: number }>({
      query: (params) => ({
        url: '/notifications/unread/',
        params
      }),
      providesTags: ['Notification']
    }),
    markNotificationAsRead: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}/mark_as_read/`,
        method: 'POST'
      }),
      invalidatesTags: ['Notification']
    }),
    markAllNotificationsAsRead: builder.mutation<{ status: string }, void>({
      query: () => ({
        url: '/notifications/mark_all_read/',
        method: 'POST'
      }),
      invalidatesTags: ['Notification']
    })
  })
});

export const {
  // Authentication hooks
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useResendActivationEmailMutation,
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
  useRefreshTokenMutation,
  useVerifyTokenMutation,
  useLogoutMutation,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useSocialAuthMutation,

  // User Interaction hooks
  useGetUserInteractionsQuery,
  useGetUserInteractionQuery,
  useCreateUserInteractionMutation,
  useLogInteractionMutation,
  // Category
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,

  // Discount
  useGetDiscountsQuery,
  useGetActiveDiscountsQuery,
  useGetDiscountQuery,
  useCreateDiscountMutation,
  useApplyDiscountMutation,

  // Place
  useGetPlacesQuery,
  useGetPlaceQuery,
  useGetSimilarPlacesQuery,
  useCreatePlaceMutation,
  useUpdatePlaceMutation,
  useDeletePlaceMutation,


  // Experience
  useGetExperiencesQuery,
  useGetExperienceQuery,
  useCheckExperienceAvailabilityQuery,
  useCreateExperienceMutation,
  useUpdateExperienceMutation,
  useDeleteExperienceMutation,

  // Flight
  useGetFlightsQuery,
  useSearchFlightsQuery,
  useGetFlightQuery,

  // Box
  useGetBoxesQuery,
  useGetBoxQuery,
  useGetBoxItineraryQuery,
  useCreateBoxMutation,

  // Booking
  useGetBookingsQuery,
  useGetUpcomingBookingsQuery,
  useGetBookingQuery,
  useCreateBookingMutation,
  useConfirmBookingMutation,
  useCancelBookingMutation,
  useUpdateBookingMutation,
  
  // Wishlist
  useGetWishlistsQuery,
  useGetUserWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,

  // Review
  useGetReviewsQuery,
  useGetUserReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,

  // Payment
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useMarkPaymentAsPaidMutation,

  // Message
  useGetMessagesQuery,
  useGetUnreadMessagesQuery,
  useSendMessageMutation,
  useMarkMessageAsReadMutation,

  // Notification
  useGetNotificationsQuery,
  useGetUnreadNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation
} = api;
