import { z } from "zod"

// Generated schemas from OpenAPI specification
// Base schemas, request schemas, and response schemas

/**
 * Account providers.
 */
export const AccountProviderSchema = z.enum(["password", "google", "apple", "facebook", "github"])
export type AccountProvider = z.infer<typeof AccountProviderSchema>
/**
 * Booking statuses.
 */
export const BookingStatusSchema = z.enum(["pending", "confirmed", "cancelled", "checked_in", "checked_out", "completed", "rejected", "refunded"])
export type BookingStatus = z.infer<typeof BookingStatusSchema>
/**
 * Booking type.
 */
export const BookingTypeSchema = z.enum(["instant", "request"])
export type BookingType = z.infer<typeof BookingTypeSchema>
/**
 * Discount types.
 */
export const DiscountTypeSchema = z.enum(["percentage", "fixed_amount", "free_nights"])
export type DiscountType = z.infer<typeof DiscountTypeSchema>
/**
 * File categories.
 */
export const FileCategorySchema = z.enum(["avatar", "listing_photo", "property_photo", "document", "identification", "other"])
export type FileCategory = z.infer<typeof FileCategorySchema>
/**
 * File types.
 */
export const FileTypeSchema = z.enum(["image", "document", "video", "audio", "other"])
export type FileType = z.infer<typeof FileTypeSchema>
/**
 * Listing status.
 */
export const ListingStatusSchema = z.enum(["draft", "active", "inactive", "suspended", "pending_review"])
export type ListingStatus = z.infer<typeof ListingStatusSchema>
/**
 * Listing types
 */
export const ListingTypeSchema = z.enum(["apartment", "house", "villa", "room", "studio", "condo", "townhouse", "cabin", "castle", "treehouse", "boat", "camper", "experience"])
export type ListingType = z.infer<typeof ListingTypeSchema>
/**
 * Payment method types.
 */
export const PaymentMethodTypeSchema = z.enum(["credit_card", "debit_card", "paypal", "stripe", "bank_transfer", "crypto", "apple_pay", "google_pay", "mpesa", "fawry", "klarna", "tamara", "tabby"])
export type PaymentMethodType = z.infer<typeof PaymentMethodTypeSchema>
/**
 * Payment statuses.
 */
export const PaymentStatusSchema = z.enum(["initiated", "authorized", "captured", "pending", "processing", "completed", "failed", "refunded", "partially_refunded"])
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>
/**
 * Subscription plan types.
 */
export const SubscriptionPlanTypeSchema = z.enum(["host", "guest"])
export type SubscriptionPlanType = z.infer<typeof SubscriptionPlanTypeSchema>
/**
 * User roles.
 */
export const UserRoleSchema = z.enum(["guest", "host", "admin", "super_admin", "agency"])
export type UserRole = z.infer<typeof UserRoleSchema>
/**
 * User status.
 */
export const UserStatusSchema = z.enum(["active", "inactive", "suspended", "pending_verification"])
export type UserStatus = z.infer<typeof UserStatusSchema>
/**
 * Schema for account deletion request.
 */
export const AccountDeletionRequestSchema = z.object({
  password: z.string(),
  confirm: z.boolean()
})
export type AccountDeletionRequest = z.infer<typeof AccountDeletionRequestSchema>
/**
 * Admin view of booking.
 */
export const AdminBookingResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  listing_id: z.string().max(40, "Maximum length is 40"),
  guest_id: z.string().max(40, "Maximum length is 40"),
  host_id: z.string().max(40, "Maximum length is 40"),
  status: BookingStatusSchema,
  check_in: z.string(),
  check_out: z.string(),
  guests: z.number().int(),
  total_amount: z.number(),
  created_at: z.string()
})
export type AdminBookingResponse = z.infer<typeof AdminBookingResponseSchema>
/**
 * Paginated list of bookings for admin.
 */
export const AdminBookingListResponseSchema = z.object({
  items: z.array(AdminBookingResponseSchema),
  total: z.number().int(),
  skip: z.number().int(),
  limit: z.number().int()
})
export type AdminBookingListResponse = z.infer<typeof AdminBookingListResponseSchema>

/**
 * Booking statistics for admin.
 */
export const AdminBookingStatsResponseSchema = z.object({
  total_bookings: z.number().int(),
  completed_bookings: z.number().int(),
  cancelled_bookings: z.number().int(),
  pending_bookings: z.number().int(),
  total_revenue: z.number(),
  avg_booking_value: z.number()
})
export type AdminBookingStatsResponse = z.infer<typeof AdminBookingStatsResponseSchema>
/**
 * Admin view of listing.
 */
export const AdminListingResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  title: z.string(),
  slug: z.string(),
  host_id: z.string().max(40, "Maximum length is 40"),
  status: ListingStatusSchema,
  city: z.any().optional(),
  country: z.any().optional(),
  price_per_night: z.number(),
  rating: z.any().optional(),
  review_count: z.number().int(),
  created_at: z.string(),
  updated_at: z.string()
})
export type AdminListingResponse = z.infer<typeof AdminListingResponseSchema>
/**
 * Paginated list of listings for admin.
 */
export const AdminListingListResponseSchema = z.object({
  items: z.array(AdminListingResponseSchema),
  total: z.number().int(),
  skip: z.number().int(),
  limit: z.number().int()
})
export type AdminListingListResponse = z.infer<typeof AdminListingListResponseSchema>
/**
 * Schema returned in user responses.
 */
export const UserResponseSchema = z.object({
  email: z.string().email("Invalid email format"),
  phone_number: z.any().optional(),
  first_name: z.any().optional(),
  last_name: z.any().optional(),
  username: z.any().optional(),
  full_name: z.any().optional(),
  id: z.string().max(40, "Maximum length is 40"),
  is_email_verified: z.boolean(),
  is_phone_verified: z.boolean(),
  avatar_url: z.any().optional(),
  bio: z.any().optional(),
  role: UserRoleSchema,
  roles: z.array(z.string()).optional(),
  status: UserStatusSchema,
  is_active: z.boolean(),
  locale: z.string(),
  language: z.string(),
  currency: z.string(),
  created_at: z.string(),
  country: z.any().optional(),
  city: z.any().optional()
})
export type UserResponse = z.infer<typeof UserResponseSchema>
/**
 * Listing statistics for admin.
 */
export const AdminListingStatsResponseSchema = z.object({
  total_listings: z.number().int(),
  active_listings: z.number().int(),
  pending_listings: z.number().int(),
  by_type: z.record(z.string(), z.any()),
  by_status: z.record(z.string(), z.any())
})
export type AdminListingStatsResponse = z.infer<typeof AdminListingStatsResponseSchema>
/**
 * Admin view of payment.
 */
export const AdminPaymentResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  booking_id: z.string().max(40, "Maximum length is 40"),
  amount: z.number(),
  status: PaymentStatusSchema,
  method: PaymentMethodTypeSchema,
  created_at: z.string(),
  completed_at: z.any().optional()
})
export type AdminPaymentResponse = z.infer<typeof AdminPaymentResponseSchema>
/**
 * Paginated list of payments for admin.
 */
export const AdminPaymentListResponseSchema = z.object({
  items: z.array(AdminPaymentResponseSchema),
  total: z.number().int(),
  skip: z.number().int(),
  limit: z.number().int()
})
export type AdminPaymentListResponse = z.infer<typeof AdminPaymentListResponseSchema>

/**
 * Payment statistics for admin.
 */
export const AdminPaymentStatsResponseSchema = z.object({
  total_payments: z.number().int(),
  completed_payments: z.number().int(),
  pending_payments: z.number().int(),
  failed_payments: z.number().int(),
  total_amount: z.number(),
  total_refunded: z.number()
})
export type AdminPaymentStatsResponse = z.infer<typeof AdminPaymentStatsResponseSchema>
/**
 * Admin view of user with additional admin fields.
 */
export const AdminUserResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  email: z.string(),
  first_name: z.any().optional(),
  last_name: z.any().optional(),
  username: z.any().optional(),
  role: UserRoleSchema,
  roles: z.array(z.string()).optional(),
  status: UserStatusSchema,
  is_active: z.boolean(),
  is_email_verified: z.boolean(),
  is_phone_verified: z.boolean(),
  created_at: z.string(),
  last_login_at: z.any().optional(),
  booking_count: z.any().optional(),
  listing_count: z.any().optional()
})
export type AdminUserResponse = z.infer<typeof AdminUserResponseSchema>
/**
 * Paginated list of users for admin.
 */
export const AdminUserListResponseSchema = z.object({
  items: z.array(AdminUserResponseSchema),
  total: z.number().int(),
  skip: z.number().int(),
  limit: z.number().int()
})
export type AdminUserListResponse = z.infer<typeof AdminUserListResponseSchema>

/**
 * User statistics for admin dashboard.
 */
export const AdminUserStatsResponseSchema = z.object({
  total_users: z.number().int(),
  active_users: z.number().int(),
  suspended_users: z.number().int(),
  pending_verification: z.number().int(),
  by_role: z.record(z.string(), z.any()),
  recent_signups: z.number().int()
})
export type AdminUserStatsResponse = z.infer<typeof AdminUserStatsResponseSchema>
/**
 * Schema for admin to update user.
 */
export const AdminUserUpdateSchema = z.object({
  role: z.any().optional(),
  status: z.any().optional(),
  is_active: z.any().optional(),
  first_name: z.any().optional(),
  last_name: z.any().optional(),
  email: z.any().optional()
})
export type AdminUserUpdate = z.infer<typeof AdminUserUpdateSchema>
/**
 * Schema returned when logging in - includes tokens and user data.
 */
export const AuthResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().optional(),
  expires_in: z.number().int(),
  user: UserResponseSchema,
  session_id: z.string()
})
export type AuthResponse = z.infer<typeof AuthResponseSchema>
export const BodyCreateCouponApiV1PromotionsCouponsPostSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.any().optional(),
  discount_type: DiscountTypeSchema,
  discount_value: z.number(),
  max_discount_amount: z.any().optional(),
  min_purchase_amount: z.number().optional(),
  start_date: z.string(),
  end_date: z.string(),
  max_uses: z.any().optional(),
  max_uses_per_user: z.number().int().optional(),
  applicable_to_properties: z.any().optional(),
  applicable_to_users: z.any().optional()
})
export type BodyCreateCouponApiV1PromotionsCouponsPost = z.infer<typeof BodyCreateCouponApiV1PromotionsCouponsPostSchema>
export const BodyRegisterDeviceApiV1UsersUsersDevicesRegisterPostSchema = z.object({
  platform: z.string(),
  fingerprint: z.string(),
  push_token: z.string().optional(),
  device_metadata: z.record(z.string(), z.any()).optional()
})
export type BodyRegisterDeviceApiV1UsersUsersDevicesRegisterPost = z.infer<typeof BodyRegisterDeviceApiV1UsersUsersDevicesRegisterPostSchema>
export const BodySendBulkPushNotificationsApiV1NotificationsPushBulkPostSchema = z.object({
  device_tokens: z.array(z.string()),
  title: z.string(),
  body: z.string(),
  data: z.any().optional()
})
export type BodySendBulkPushNotificationsApiV1NotificationsPushBulkPost = z.infer<typeof BodySendBulkPushNotificationsApiV1NotificationsPushBulkPostSchema>
export const BodySendPushNotificationApiV1NotificationsPushSendPostSchema = z.object({
  device_token: z.any().optional(),
  title: z.string(),
  body: z.string(),
  data: z.any().optional(),
  send_to_all_devices: z.boolean().optional()
})
export type BodySendPushNotificationApiV1NotificationsPushSendPost = z.infer<typeof BodySendPushNotificationApiV1NotificationsPushSendPostSchema>
export const BodyUploadFileApiV1FilesUploadPostSchema = z.object({
  file: z.string()
})
export type BodyUploadFileApiV1FilesUploadPost = z.infer<typeof BodyUploadFileApiV1FilesUploadPostSchema>
export const BodyUploadMultipleFilesApiV1FilesUploadMultiplePostSchema = z.object({
  files: z.array(z.string())
})
export type BodyUploadMultipleFilesApiV1FilesUploadMultiplePost = z.infer<typeof BodyUploadMultipleFilesApiV1FilesUploadMultiplePostSchema>
/**
 * Cancel booking schema.
 */
export const BookingCancelSchema = z.object({
  cancellation_reason: z.any().optional()
})
export type BookingCancel = z.infer<typeof BookingCancelSchema>
/**
 * Schema for creating a booking.
 */
export const BookingCreateSchema = z.object({
  listing_id: z.string().max(40, "Maximum length is 40"),
  check_in: z.string(),
  check_out: z.string(),
  guests: z.number().int().min(1, "Minimum value is 1").optional(),
  adults: z.number().int().min(1, "Minimum value is 1").optional(),
  children: z.number().int().min(0, "Minimum value is 0").optional(),
  infants: z.number().int().min(0, "Minimum value is 0").optional(),
  special_requests: z.any().optional(),
  guest_message: z.any().optional(),
  coupon_code: z.any().optional()
})
export type BookingCreate = z.infer<typeof BookingCreateSchema>
/**
 * Timeline event response schema.
 */
export const BookingTimelineEventResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  status: z.string(),
  payload: z.any().optional(),
  created_at: z.string()
})
export type BookingTimelineEventResponse = z.infer<typeof BookingTimelineEventResponseSchema>
/**
 * Booking response schema.
 */
export const BookingResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  booking_number: z.string(),
  listing_id: z.string().max(40, "Maximum length is 40"),
  guest_id: z.string().max(40, "Maximum length is 40"),
  check_in: z.string(),
  check_out: z.string(),
  nights: z.number().int(),
  guests: z.number().int(),
  adults: z.number().int(),
  children: z.number().int(),
  infants: z.number().int(),
  total_amount: z.number(),
  payout_amount: z.any().optional(),
  currency: z.string(),
  fees: z.any().optional(),
  status: z.string(),
  payment_status: z.string(),
  payment_method: z.any().optional(),
  payment_id: z.any().optional(),
  special_requests: z.any().optional(),
  guest_message: z.any().optional(),
  cancelled_at: z.any().optional(),
  cancellation_reason: z.any().optional(),
  timeline_events: z.array(BookingTimelineEventResponseSchema).optional(),
  created_at: z.string(),
  updated_at: z.string()
})
export type BookingResponse = z.infer<typeof BookingResponseSchema>
/**
 * Booking list response schema.
 */
export const BookingListResponseSchema = z.object({
  items: z.array(BookingResponseSchema),
  total: z.number().int(),
  skip: z.number().int(),
  limit: z.number().int()
})
export type BookingListResponse = z.infer<typeof BookingListResponseSchema>
/**
 * Single data point for booking trends.
 */
export const BookingTrendDataPointSchema = z.object({
  date: z.string(),
  bookings: z.number().int(),
  revenue: z.number(),
  completed: z.number().int()
})
export type BookingTrendDataPoint = z.infer<typeof BookingTrendDataPointSchema>
/**
 * Booking trends over time.
 */
export const BookingTrendsResponseSchema = z.object({
  trends: z.array(BookingTrendDataPointSchema),
  period_days: z.number().int()
})
export type BookingTrendsResponse = z.infer<typeof BookingTrendsResponseSchema>
/**
 * Schema for creating a conversation.
 */
export const ConversationCreateSchema = z.object({
  participant_id: z.string().max(40, "Maximum length is 40"),
  listing_id: z.any().optional(),
  booking_id: z.any().optional()
})
export type ConversationCreate = z.infer<typeof ConversationCreateSchema>
/**
 * Schema returned in message responses.
 */
export const MessageResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  conversation_id: z.any().optional(),
  sender_id: z.any().optional(),
  receiver_id: z.any().optional(),
  source: z.string(),
  body: z.string(),
  content: z.any().optional(),
  is_read: z.boolean(),
  read_at: z.any().optional(),
  attachments: z.any().optional(),
  created_at: z.string()
})
export type MessageResponse = z.infer<typeof MessageResponseSchema>
/**
 * Schema returned in conversation responses.
 */
export const ConversationResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  booking_id: z.any().optional(),
  listing_id: z.any().optional(),
  participants: z.array(z.string().max(40, "Maximum length is 40")).optional(),
  messages: z.array(MessageResponseSchema).optional(),
  created_at: z.string(),
  updated_at: z.string()
})
export type ConversationResponse = z.infer<typeof ConversationResponseSchema>
/**
 * Schema for a paginated list of conversations.
 */
export const ConversationListResponseSchema = z.object({
  items: z.array(ConversationResponseSchema),
  total: z.number().int(),
  skip: z.number().int(),
  limit: z.number().int()
})
export type ConversationListResponse = z.infer<typeof ConversationListResponseSchema>
/**
 * Admin dashboard metrics.
 */
export const DashboardMetricsResponseSchema = z.object({
  period: z.record(z.string(), z.any()),
  bookings: z.record(z.string(), z.any()),
  revenue: z.record(z.string(), z.any()),
  users: z.record(z.string(), z.any()),
  listings: z.record(z.string(), z.any())
})
export type DashboardMetricsResponse = z.infer<typeof DashboardMetricsResponseSchema>
/**
 * Schema for GDPR data export response.
 */
export const DataExportResponseSchema = z.object({
  export_date: z.string(),
  user_id: z.string(),
  data: z.record(z.string(), z.any())
})
export type DataExportResponse = z.infer<typeof DataExportResponseSchema>
/**
 * Schema for verifying email with code.
 */
export const EmailVerificationRequestSchema = z.object({
  code: z.string()
})
export type EmailVerificationRequest = z.infer<typeof EmailVerificationRequestSchema>
/**
 * File response schema.
 */
export const FileResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  filename: z.string(),
  original_filename: z.string(),
  file_url: z.string(),
  file_type: FileTypeSchema,
  file_category: FileCategorySchema,
  mime_type: z.string(),
  file_size: z.number().int(),
  uploaded_by: z.string().max(40, "Maximum length is 40"),
  description: z.any().optional(),
  created_at: z.string()
})
export type FileResponse = z.infer<typeof FileResponseSchema>
/**
 * File upload response schema.
 */
export const FileUploadResponseSchema = z.object({
  message: z.string(),
  file: FileResponseSchema
})
export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>
export const ValidationErrorSchema = z.object({
  loc: z.array(z.any()),
  msg: z.string(),
  type: z.string()
})
export type ValidationError = z.infer<typeof ValidationErrorSchema>
export const HTTPValidationErrorSchema = z.object({
  detail: z.array(ValidationErrorSchema).optional()
})
export type HTTPValidationError = z.infer<typeof HTTPValidationErrorSchema>
/**
 * Schema for creating a listing.
 */
export const ListingCreateSchema = z.object({
  title: z.string().min(5, "Minimum length is 5").max(500, "Maximum length is 500"),
  summary: z.any().optional(),
  description: z.any().optional(),
  listing_type: ListingTypeSchema,
  address_line1: z.string().min(5, "Minimum length is 5"),
  address_line2: z.any().optional(),
  city: z.string().min(2, "Minimum length is 2"),
  state: z.any().optional(),
  country: z.string().min(2, "Minimum length is 2"),
  postal_code: z.any().optional(),
  latitude: z.any().optional(),
  longitude: z.any().optional(),
  capacity: z.number().int().min(1, "Minimum value is 1").optional(),
  bedrooms: z.number().int().min(0, "Minimum value is 0").optional(),
  beds: z.number().int().min(0, "Minimum value is 0").optional(),
  bathrooms: z.any().optional(),
  max_guests: z.number().int().min(1, "Minimum value is 1").optional(),
  square_meters: z.any().optional(),
  base_price: z.any(),
  currency: z.string().optional(),
  cleaning_fee: z.any().optional(),
  service_fee: z.any().optional(),
  security_deposit: z.any().optional(),
  booking_type: BookingTypeSchema.optional(),
  min_stay_nights: z.any().optional(),
  max_stay_nights: z.any().optional(),
  check_in_time: z.any().optional(),
  check_out_time: z.any().optional()
})
export type ListingCreate = z.infer<typeof ListingCreateSchema>
/**
 * Listing image response schema (from Prisma).
 */
export const ListingImageResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  url: z.string(),
  caption: z.any().optional(),
  position: z.number().int()
})
export type ListingImageResponse = z.infer<typeof ListingImageResponseSchema>
/**
 * Listing photo response schema.
 */
export const ListingPhotoResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  url: z.string(),
  thumbnail_url: z.any().optional(),
  caption: z.any().optional(),
  position: z.number().int(),
  is_primary: z.boolean()
})
export type ListingPhotoResponse = z.infer<typeof ListingPhotoResponseSchema>
/**
 * Full listing response schema - complete data for authenticated users
 */
export const ListingResponseSchema = z.object({
  title: z.string().min(5, "Minimum length is 5").max(500, "Maximum length is 500"),
  summary: z.any().optional(),
  description: z.any().optional(),
  listing_type: ListingTypeSchema,
  address_line1: z.string().min(5, "Minimum length is 5"),
  address_line2: z.any().optional(),
  city: z.string().min(2, "Minimum length is 2"),
  state: z.any().optional(),
  country: z.string().min(2, "Minimum length is 2"),
  postal_code: z.any().optional(),
  latitude: z.any().optional(),
  longitude: z.any().optional(),
  capacity: z.number().int().min(1, "Minimum value is 1").optional(),
  bedrooms: z.number().int().min(0, "Minimum value is 0").optional(),
  beds: z.number().int().min(0, "Minimum value is 0").optional(),
  bathrooms: z.string().optional(),
  max_guests: z.number().int().min(1, "Minimum value is 1").optional(),
  square_meters: z.any().optional(),
  base_price: z.string(),
  currency: z.string().optional(),
  cleaning_fee: z.any().optional(),
  service_fee: z.any().optional(),
  security_deposit: z.any().optional(),
  booking_type: BookingTypeSchema.optional(),
  min_stay_nights: z.any().optional(),
  max_stay_nights: z.any().optional(),
  check_in_time: z.any().optional(),
  check_out_time: z.any().optional(),
  id: z.string().max(40, "Maximum length is 40"),
  slug: z.string(),
  status: ListingStatusSchema,
  rating: z.string(),
  review_count: z.number().int(),
  host_profile_id: z.any().optional(),
  host_id: z.any().optional(),
  photos: z.array(ListingPhotoResponseSchema).optional(),
  images: z.array(ListingImageResponseSchema).optional(),
  location: z.any().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  is_favorite: z.any().optional(),
  can_book: z.any().optional(),
  viewed_recently: z.any().optional()
})
export type ListingResponse = z.infer<typeof ListingResponseSchema>
/**
 * Listing list response schema.
 */
export const ListingListResponseSchema = z.object({
  items: z.array(ListingResponseSchema),
  total: z.number().int(),
  skip: z.number().int(),
  limit: z.number().int()
})
export type ListingListResponse = z.infer<typeof ListingListResponseSchema>
/**
 * Schema for creating a listing location.
 */
export const ListingLocationCreateSchema = z.object({
  timezone: z.string().optional(),
  neighborhood: z.any().optional(),
  latitude: z.any(),
  longitude: z.any()
})
export type ListingLocationCreate = z.infer<typeof ListingLocationCreateSchema>
/**
 * Listing location response schema.
 */
export const ListingLocationResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  timezone: z.string(),
  neighborhood: z.any().optional()
})
export type ListingLocationResponse = z.infer<typeof ListingLocationResponseSchema>

/**
 * Schema for updating a listing.
 */
export const ListingUpdateSchema = z.object({
  title: z.any().optional(),
  summary: z.any().optional(),
  description: z.any().optional(),
  listing_type: z.any().optional(),
  address_line1: z.any().optional(),
  address_line2: z.any().optional(),
  city: z.any().optional(),
  state: z.any().optional(),
  country: z.any().optional(),
  postal_code: z.any().optional(),
  latitude: z.any().optional(),
  longitude: z.any().optional(),
  capacity: z.any().optional(),
  bedrooms: z.any().optional(),
  beds: z.any().optional(),
  bathrooms: z.any().optional(),
  max_guests: z.any().optional(),
  square_meters: z.any().optional(),
  base_price: z.any().optional(),
  cleaning_fee: z.any().optional(),
  service_fee: z.any().optional(),
  security_deposit: z.any().optional(),
  min_stay_nights: z.any().optional(),
  max_stay_nights: z.any().optional(),
  status: z.any().optional()
})
export type ListingUpdate = z.infer<typeof ListingUpdateSchema>
/**
 * Loyalty status response.
 */
export const LoyaltyStatusResponseSchema = z.object({
  balance: z.number().int(),
  tier: z.string(),
  tier_name: z.string(),
  points_per_dollar: z.number(),
  discount_percentage: z.number().int(),
  priority_support: z.boolean(),
  points_to_next_tier: z.any().optional(),
  next_tier: z.any().optional(),
  expires_at: z.any().optional(),
  recent_transactions: z.array(z.record(z.string(), z.any())).optional(),
  program_name: z.string()
})
export type LoyaltyStatusResponse = z.infer<typeof LoyaltyStatusResponseSchema>
/**
 * Schema for creating a message.
 */
export const MessageCreateSchema = z.object({
  conversation_id: z.any().optional(),
  receiver_id: z.any().optional(),
  listing_id: z.any().optional(),
  booking_id: z.any().optional(),
  subject: z.any().optional(),
  body: z.string().min(1, "Minimum length is 1"),
  content: z.any().optional(),
  attachments: z.any().optional()
})
export type MessageCreate = z.infer<typeof MessageCreateSchema>
/**
 * Schema for a paginated list of messages.
 */
export const MessageListResponseSchema = z.object({
  items: z.array(MessageResponseSchema),
  total: z.number().int(),
  skip: z.number().int(),
  limit: z.number().int()
})
export type MessageListResponse = z.infer<typeof MessageListResponseSchema>
/**
 * Schema for OAuth-based login requests.
 */
export const OAuthLoginSchema = z.object({
  provider: AccountProviderSchema,
  token: z.string(),
  provider_id: z.any().optional()
})
export type OAuthLogin = z.infer<typeof OAuthLoginSchema>
/**
 * Schema for requesting a one-time password (OTP).
 */
export const OTPRequestSchema = z.object({
  phone_number: z.string()
})
export type OTPRequest = z.infer<typeof OTPRequestSchema>
/**
 * Schema for verifying a one-time password (OTP).
 */
export const OTPVerifySchema = z.object({
  phone_number: z.string(),
  code: z.string()
})
export type OTPVerify = z.infer<typeof OTPVerifySchema>
/**
 * Schema for changing password (authenticated user).
 */
export const PasswordChangeSchema = z.object({
  current_password: z.string(),
  new_password: z.string().min(8, "Minimum length is 8")
})
export type PasswordChange = z.infer<typeof PasswordChangeSchema>
/**
 * Schema for resetting password with verification code.
 */
export const PasswordResetSchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string(),
  new_password: z.string().min(8, "Minimum length is 8")
})
export type PasswordReset = z.infer<typeof PasswordResetSchema>
/**
 * Schema for requesting a password reset.
 */
export const PasswordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format")
})
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>
/**
 * Create payment intent request
 */
export const PaymentIntentCreateSchema = z.object({
  booking_id: z.string(),
  amount: z.any(),
  currency: z.string().optional()
})
export type PaymentIntentCreate = z.infer<typeof PaymentIntentCreateSchema>
/**
 * Payment intent response
 */
export const PaymentIntentResponseSchema = z.object({
  client_secret: z.string(),
  payment_intent_id: z.string()
})
export type PaymentIntentResponse = z.infer<typeof PaymentIntentResponseSchema>
/**
 * Process payment request
 */
export const PaymentProcessSchema = z.object({
  booking_id: z.string(),
  payment_intent_id: z.string(),
  payment_method: PaymentMethodTypeSchema
})
export type PaymentProcess = z.infer<typeof PaymentProcessSchema>
/**
 * Payment response
 */
export const PaymentResponseSchema = z.object({
  id: z.string(),
  booking_id: z.any(),
  amount: z.string(),
  currency: z.string(),
  status: PaymentStatusSchema,
  payment_method: z.any(),
  stripe_payment_intent_id: z.any(),
  created_at: z.string()
})
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>
/**
 * Request to redeem points.
 */
export const PointsRedemptionRequestSchema = z.object({
  points: z.number().int().min(100, "Minimum value is 100"),
  booking_id: z.any().optional()
})
export type PointsRedemptionRequest = z.infer<typeof PointsRedemptionRequestSchema>
/**
 * Response for points redemption.
 */
export const PointsRedemptionResponseSchema = z.object({
  points_redeemed: z.number().int(),
  discount_amount: z.number(),
  new_balance: z.number().int(),
  transaction_id: z.string()
})
export type PointsRedemptionResponse = z.infer<typeof PointsRedemptionResponseSchema>
/**
 * Popular destination data.
 */
export const PopularDestinationResponseSchema = z.object({
  city: z.string(),
  country: z.string(),
  bookings: z.number().int(),
  avg_revenue: z.number()
})
export type PopularDestinationResponse = z.infer<typeof PopularDestinationResponseSchema>
/**
 * List of popular destinations.
 */
export const PopularDestinationsResponseSchema = z.object({
  destinations: z.array(PopularDestinationResponseSchema),
  period_days: z.number().int()
})
export type PopularDestinationsResponse = z.infer<typeof PopularDestinationsResponseSchema>
/**
 * Public location response - limited data for unauthenticated users
 */
export const PublicListingLocationResponseSchema = z.object({
  city: z.string(),
  country: z.string(),
  neighborhood: z.any().optional(),
  approximate_latitude: z.any().optional(),
  approximate_longitude: z.any().optional()
})
export type PublicListingLocationResponse = z.infer<typeof PublicListingLocationResponseSchema>
/**
 * Public listing response - limited data for unauthenticated users
 */
export const PublicListingResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  slug: z.string(),
  title: z.string(),
  summary: z.any().optional(),
  description: z.any().optional(),
  listing_type: ListingTypeSchema,
  status: ListingStatusSchema,
  rating: z.string(),
  review_count: z.number().int(),
  city: z.string(),
  country: z.string(),
  state: z.any().optional(),
  approximate_location: z.any().optional(),
  base_price: z.string(),
  currency: z.string(),
  cleaning_fee: z.any().optional(),
  service_fee: z.any().optional(),
  capacity: z.number().int(),
  bedrooms: z.number().int(),
  beds: z.number().int(),
  bathrooms: z.string(),
  max_guests: z.number().int(),
  square_meters: z.any().optional(),
  photos: z.array(ListingPhotoResponseSchema).optional(),
  images: z.array(ListingImageResponseSchema).optional(),
  booking_type: BookingTypeSchema,
  min_stay_nights: z.any().optional(),
  max_stay_nights: z.any().optional(),
  check_in_time: z.any().optional(),
  check_out_time: z.any().optional(),
  host_id: z.any().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  is_favorite: z.boolean().optional(),
  can_book: z.boolean().optional()
})
export type PublicListingResponse = z.infer<typeof PublicListingResponseSchema>
/**
 * Redemption option.
 */
export const RedemptionOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  points_required: z.number().int(),
  value: z.number(),
  type: z.string()
})
export type RedemptionOption = z.infer<typeof RedemptionOptionSchema>
/**
 * Response with available redemption options.
 */
export const RedemptionOptionsResponseSchema = z.object({
  options: z.array(RedemptionOptionSchema)
})
export type RedemptionOptionsResponse = z.infer<typeof RedemptionOptionsResponseSchema>
/**
 * Schema for refresh-token requests.
 */
export const RefreshTokenRequestSchema = z.object({
  refresh_token: z.string()
})
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>
export const ResendEmailVerificationRequestSchema = z.object({
  email: z.string().email("Invalid email format")
})
export type ResendEmailVerificationRequest = z.infer<typeof ResendEmailVerificationRequestSchema>
/**
 * Schema for creating a review.
 */
export const ReviewCreateSchema = z.object({
  listing_id: z.string().max(40, "Maximum length is 40"),
  booking_id: z.any().optional(),
  overall_rating: z.number().min(1, "Minimum value is 1").max(5, "Maximum value is 5"),
  cleanliness_rating: z.any().optional(),
  communication_rating: z.any().optional(),
  check_in_rating: z.any().optional(),
  accuracy_rating: z.any().optional(),
  location_rating: z.any().optional(),
  value_rating: z.any().optional(),
  title: z.any().optional(),
  comment: z.any().optional()
})
export type ReviewCreate = z.infer<typeof ReviewCreateSchema>
/**
 * Schema for marking a review as helpful or not helpful.
 */
export const ReviewHelpfulRequestSchema = z.object({
  is_helpful: z.boolean().optional()
})
export type ReviewHelpfulRequest = z.infer<typeof ReviewHelpfulRequestSchema>
/**
 * Schema returned for a review, including aggregates and host response.
 */
export const ReviewResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  listing_id: z.string().max(40, "Maximum length is 40"),
  booking_id: z.any().optional(),
  guest_id: z.string().max(40, "Maximum length is 40"),
  host_id: z.string().max(40, "Maximum length is 40"),
  overall_rating: z.number(),
  cleanliness_rating: z.any().optional(),
  communication_rating: z.any().optional(),
  check_in_rating: z.any().optional(),
  accuracy_rating: z.any().optional(),
  location_rating: z.any().optional(),
  value_rating: z.any().optional(),
  title: z.any().optional(),
  comment: z.any().optional(),
  is_verified: z.boolean(),
  is_public: z.boolean(),
  visibility: z.string(),
  moderation_status: z.string(),
  helpful_count: z.number().int(),
  response: z.any().optional(),
  created_at: z.string()
})
export type ReviewResponse = z.infer<typeof ReviewResponseSchema>
/**
 * Schema for a paginated list of reviews.
 */
export const ReviewListResponseSchema = z.object({
  items: z.array(ReviewResponseSchema),
  total: z.number().int(),
  skip: z.number().int(),
  limit: z.number().int()
})
export type ReviewListResponse = z.infer<typeof ReviewListResponseSchema>
/**
 * Schema for creating a host response to a review.
 */
export const ReviewResponseCreateSchema = z.object({
  comment: z.string().min(1, "Minimum length is 1")
})
export type ReviewResponseCreate = z.infer<typeof ReviewResponseCreateSchema>
/**
 * Schema returned for a host's response to a review.
 */
export const ReviewResponseResponseSchema = z.object({
  id: z.string().max(40, "Maximum length is 40"),
  review_id: z.string().max(40, "Maximum length is 40"),
  host_profile_id: z.string().max(40, "Maximum length is 40"),
  comment: z.string(),
  created_at: z.string()
})
export type ReviewResponseResponse = z.infer<typeof ReviewResponseResponseSchema>
/**
 * Schema for search responses.
 */
export const SearchResponseSchema = z.object({
  items: z.array(ListingResponseSchema),
  total: z.number().int(),
  skip: z.number().int(),
  limit: z.number().int(),
  query: z.any().optional()
})
export type SearchResponse = z.infer<typeof SearchResponseSchema>
/**
 * Schema for a single search suggestion.
 */
export const SearchSuggestionSchema = z.object({
  type: z.string(),
  text: z.string(),
  value: z.string()
})
export type SearchSuggestion = z.infer<typeof SearchSuggestionSchema>
/**
 * Schema for search suggestions response.
 */
export const SearchSuggestionsResponseSchema = z.object({
  suggestions: z.array(SearchSuggestionSchema)
})
export type SearchSuggestionsResponse = z.infer<typeof SearchSuggestionsResponseSchema>
/**
 * Schema returned when issuing access and refresh tokens.
 */
export const TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().optional(),
  expires_in: z.number().int()
})
export type TokenResponse = z.infer<typeof TokenResponseSchema>
/**
 * Schema for creating a travel guide.
 */
export const TravelGuideCreateSchema = z.object({
  title: z.string().min(1, "Minimum length is 1").max(500, "Maximum length is 500"),
  content: z.string().min(1, "Minimum length is 1"),
  destination: z.string().min(1, "Minimum length is 1").max(200, "Maximum length is 200"),
  country: z.string().min(1, "Minimum length is 1").max(100, "Maximum length is 100"),
  summary: z.any().optional(),
  city: z.any().optional(),
  tags: z.any().optional(),
  categories: z.any().optional(),
  cover_image_url: z.any().optional(),
  image_urls: z.any().optional(),
  is_official: z.boolean().optional()
})
export type TravelGuideCreate = z.infer<typeof TravelGuideCreateSchema>
/**
 * Schema for travel guide response.
 */
export const TravelGuideResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: z.any(),
  content: z.string(),
  author_id: z.any(),
  is_official: z.boolean(),
  destination: z.string(),
  city: z.any(),
  country: z.string(),
  cover_image_url: z.any(),
  image_urls: z.array(z.string()),
  tags: z.array(z.string()),
  categories: z.array(z.string()),
  reading_time_minutes: z.any(),
  view_count: z.number().int(),
  like_count: z.number().int(),
  bookmark_count: z.number().int(),
  status: z.string(),
  published_at: z.any(),
  created_at: z.string(),
  updated_at: z.string()
})
export type TravelGuideResponse = z.infer<typeof TravelGuideResponseSchema>
/**
 * Travel plan request schema.
 */
export const TravelPlanRequestSchema = z.object({
  destination: z.string().min(2, "Minimum length is 2").max(200, "Maximum length is 200"),
  start_date: z.string(),
  end_date: z.string(),
  budget: z.any(),
  currency: z.string().optional(),
  travelers_count: z.number().int().min(1, "Minimum value is 1").optional(),
  travel_style: z.any().optional(),
  preferences: z.any().optional(),
  natural_language_request: z.any().optional()
})
export type TravelPlanRequest = z.infer<typeof TravelPlanRequestSchema>
/**
 * Travel plan response schema.
 */
export const TravelPlanResponseSchema = z.object({
  id: z.number().int(),
  destination: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  duration_days: z.number().int(),
  budget: z.string(),
  currency: z.string(),
  travelers_count: z.number().int(),
  travel_style: z.any().optional(),
  plan_title: z.any().optional(),
  plan_summary: z.any().optional(),
  daily_itinerary: z.array(z.record(z.string(), z.any())).optional(),
  recommended_properties: z.array(z.number().int()).optional(),
  recommended_activities: z.array(z.record(z.string(), z.any())).optional(),
  recommended_restaurants: z.array(z.record(z.string(), z.any())).optional(),
  transportation_suggestions: z.array(z.record(z.string(), z.any())).optional(),
  estimated_accommodation_cost: z.any().optional(),
  estimated_activities_cost: z.any().optional(),
  estimated_food_cost: z.any().optional(),
  estimated_transportation_cost: z.any().optional(),
  total_estimated_cost: z.any().optional(),
  is_saved: z.boolean(),
  is_booked: z.boolean(),
  created_at: z.string()
})
export type TravelPlanResponse = z.infer<typeof TravelPlanResponseSchema>
/**
 * Schema for verifying 2FA during login.
 */
export const TwoFactorLoginVerifySchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string(),
  is_backup_code: z.boolean().optional()
})
export type TwoFactorLoginVerify = z.infer<typeof TwoFactorLoginVerifySchema>
/**
 * Schema for 2FA setup response.
 */
export const TwoFactorSetupResponseSchema = z.object({
  secret: z.string(),
  qr_code: z.string(),
  backup_codes: z.array(z.string()),
  message: z.string()
})
export type TwoFactorSetupResponse = z.infer<typeof TwoFactorSetupResponseSchema>
/**
 * Schema for 2FA status response.
 */
export const TwoFactorStatusResponseSchema = z.object({
  enabled: z.boolean(),
  required: z.boolean(),
  backup_codes_count: z.number().int()
})
export type TwoFactorStatusResponse = z.infer<typeof TwoFactorStatusResponseSchema>
/**
 * Schema for verifying two-factor authentication (2FA).
 */
export const TwoFactorVerifyRequestSchema = z.object({
  code: z.string(),
  method: z.string()
})
export type TwoFactorVerifyRequest = z.infer<typeof TwoFactorVerifyRequestSchema>
/**
 * Schema for creating a new user.
 */
export const UserCreateSchema = z.object({
  email: z.string().email("Invalid email format"),
  phone_number: z.any().optional(),
  first_name: z.any().optional(),
  last_name: z.any().optional(),
  username: z.any().optional(),
  full_name: z.any().optional(),
  password: z.string().min(8, "Minimum length is 8"),
  language: z.string().optional(),
  locale: z.string().optional(),
  currency: z.string().optional()
})
export type UserCreate = z.infer<typeof UserCreateSchema>
/**
 * Schema for user login requests.
 */
export const UserLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string()
})
export type UserLogin = z.infer<typeof UserLoginSchema>

/**
 * Schema for creating a user story.
 */
export const UserStoryCreateSchema = z.object({
  title: z.string().min(1, "Minimum length is 1").max(500, "Maximum length is 500"),
  content: z.string().min(1, "Minimum length is 1"),
  destination: z.string().min(1, "Minimum length is 1").max(200, "Maximum length is 200"),
  country: z.string().min(1, "Minimum length is 1").max(100, "Maximum length is 100"),
  city: z.any().optional(),
  travel_date: z.any().optional(),
  duration_days: z.any().optional(),
  travel_style: z.any().optional(),
  tags: z.any().optional(),
  cover_image_url: z.any().optional(),
  image_urls: z.any().optional(),
  video_urls: z.any().optional(),
  guide_id: z.any().optional()
})
export type UserStoryCreate = z.infer<typeof UserStoryCreateSchema>
/**
 * Schema for user story response.
 */
export const UserStoryResponseSchema = z.object({
  id: z.string(),
  author_id: z.string(),
  title: z.string(),
  content: z.string(),
  summary: z.any(),
  destination: z.string(),
  city: z.any(),
  country: z.string(),
  cover_image_url: z.any(),
  image_urls: z.array(z.string()),
  video_urls: z.array(z.string()),
  travel_date: z.any(),
  duration_days: z.any(),
  travel_style: z.any(),
  tags: z.array(z.string()),
  view_count: z.number().int(),
  like_count: z.number().int(),
  comment_count: z.number().int(),
  share_count: z.number().int(),
  guide_id: z.any(),
  status: z.string(),
  published_at: z.any(),
  is_featured: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
})
export type UserStoryResponse = z.infer<typeof UserStoryResponseSchema>
/**
 * Schema for updating an existing user.
 */
export const UserUpdateSchema = z.object({
  first_name: z.any().optional(),
  last_name: z.any().optional(),
  full_name: z.any().optional(),
  phone_number: z.any().optional(),
  bio: z.any().optional(),
  avatar_url: z.any().optional(),
  country: z.any().optional(),
  city: z.any().optional(),
  language: z.any().optional(),
  locale: z.any().optional(),
  currency: z.any().optional(),
  date_of_birth: z.any().optional()
})
export type UserUpdate = z.infer<typeof UserUpdateSchema>
/**
 * Success response schema for GET /health
 * Status: 200
 * Successful Response
 */
export const HealthCheckHealthGetResponseSchema = z.any()

export type HealthCheckHealthGetResponse = z.infer<typeof HealthCheckHealthGetResponseSchema>
/**
 * Success response schema for GET /health/ready
 * Status: 200
 * Successful Response
 */
export const ReadinessCheckHealthReadyGetResponseSchema = z.any()

export type ReadinessCheckHealthReadyGetResponse = z.infer<typeof ReadinessCheckHealthReadyGetResponseSchema>
/**
 * Success response schema for GET /health/live
 * Status: 200
 * Successful Response
 */
export const LivenessCheckHealthLiveGetResponseSchema = z.any()

export type LivenessCheckHealthLiveGetResponse = z.infer<typeof LivenessCheckHealthLiveGetResponseSchema>
/**
 * Success response schema for GET /.well-known/apple-developer-merchantid-domain-association
 * Status: 200
 * Successful Response
 */
export const ApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGetResponseSchema = z.any()

export type ApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGetResponse = z.infer<typeof ApplePayDomainAssociationWellKnownAppleDeveloperMerchantidDomainAssociationGetResponseSchema>
/**
 * Request schema for POST /api/v1/users/users/devices/register
 */
export const RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema = BodyRegisterDeviceApiV1UsersUsersDevicesRegisterPostSchema
export type RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequest = z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/users/devices/register
 * Status: 200
 * Successful Response
 */
export const RegisterDeviceApiV1UsersUsersDevicesRegisterPostResponseSchema = z.record(z.string(), z.any())

export type RegisterDeviceApiV1UsersUsersDevicesRegisterPostResponse = z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/users/devices/register
 * Status: 422
 * Validation Error
 */
export const RegisterDeviceApiV1UsersUsersDevicesRegisterPostErrorSchema = HTTPValidationErrorSchema

export type RegisterDeviceApiV1UsersUsersDevicesRegisterPostError = z.infer<typeof RegisterDeviceApiV1UsersUsersDevicesRegisterPostErrorSchema>
/**
 * Success response schema for GET /api/v1/users/users/devices
 * Status: 200
 * Successful Response
 */
export const ListDevicesApiV1UsersUsersDevicesGetResponseSchema = z.array(z.record(z.string(), z.any()))

export type ListDevicesApiV1UsersUsersDevicesGetResponse = z.infer<typeof ListDevicesApiV1UsersUsersDevicesGetResponseSchema>
/**
 * Success response schema for DELETE /api/v1/users/users/devices/{device_id}
 * Status: 200
 * Successful Response
 */
export const RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteResponseSchema = z.any()

export type RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteResponse = z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteResponseSchema>
/**
 * Error response schema for DELETE /api/v1/users/users/devices/{device_id}
 * Status: 422
 * Validation Error
 */
export const RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteErrorSchema = HTTPValidationErrorSchema

export type RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteError = z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteErrorSchema>
/**
 * Parameters schema for DELETE /api/v1/users/users/devices/{device_id}
 * Path params: device_id
 * Query params: none
 * Header params: none
 */
export const RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema = z.object({
  path: z.object({
    device_id: z.string().max(40, "Maximum length is 40")
  })
})

export type RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParams = z.infer<typeof RemoveDeviceApiV1UsersUsersDevicesDeviceIdDeleteParamsSchema>
/**
 * Request schema for PATCH /api/v1/users/users/devices/{device_id}/trust
 */
export const MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema = z.boolean()
export type MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequest = z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchRequestSchema>
/**
 * Success response schema for PATCH /api/v1/users/users/devices/{device_id}/trust
 * Status: 200
 * Successful Response
 */
export const MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchResponseSchema = z.record(z.string(), z.any())

export type MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchResponse = z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchResponseSchema>
/**
 * Error response schema for PATCH /api/v1/users/users/devices/{device_id}/trust
 * Status: 422
 * Validation Error
 */
export const MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchErrorSchema = HTTPValidationErrorSchema

export type MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchError = z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchErrorSchema>
/**
 * Parameters schema for PATCH /api/v1/users/users/devices/{device_id}/trust
 * Path params: device_id
 * Query params: none
 * Header params: none
 */
export const MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema = z.object({
  path: z.object({
    device_id: z.string().max(40, "Maximum length is 40")
  })
})

export type MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParams = z.infer<typeof MarkDeviceTrustedApiV1UsersUsersDevicesDeviceIdTrustPatchParamsSchema>
/**
 * Request schema for POST /api/v1/users/register
 */
export const RegisterApiV1UsersRegisterPostRequestSchema = UserCreateSchema
export type RegisterApiV1UsersRegisterPostRequest = z.infer<typeof RegisterApiV1UsersRegisterPostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/register
 * Status: 201
 * Successful Response
 */
export const RegisterApiV1UsersRegisterPostResponseSchema = UserResponseSchema

export type RegisterApiV1UsersRegisterPostResponse = z.infer<typeof RegisterApiV1UsersRegisterPostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/register
 * Status: 422
 * Validation Error
 */
export const RegisterApiV1UsersRegisterPostErrorSchema = HTTPValidationErrorSchema

export type RegisterApiV1UsersRegisterPostError = z.infer<typeof RegisterApiV1UsersRegisterPostErrorSchema>
/**
 * Request schema for POST /api/v1/users/login
 */
export const LoginApiV1UsersLoginPostRequestSchema = UserLoginSchema
export type LoginApiV1UsersLoginPostRequest = z.infer<typeof LoginApiV1UsersLoginPostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/login
 * Status: 200
 * Successful Response
 */
export const LoginApiV1UsersLoginPostResponseSchema = AuthResponseSchema

export type LoginApiV1UsersLoginPostResponse = z.infer<typeof LoginApiV1UsersLoginPostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/login
 * Status: 422
 * Validation Error
 */
export const LoginApiV1UsersLoginPostErrorSchema = HTTPValidationErrorSchema

export type LoginApiV1UsersLoginPostError = z.infer<typeof LoginApiV1UsersLoginPostErrorSchema>
/**
 * Request schema for POST /api/v1/users/refresh
 */
export const RefreshTokenApiV1UsersRefreshPostRequestSchema = RefreshTokenRequestSchema
export type RefreshTokenApiV1UsersRefreshPostRequest = z.infer<typeof RefreshTokenApiV1UsersRefreshPostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/refresh
 * Status: 200
 * Successful Response
 */
export const RefreshTokenApiV1UsersRefreshPostResponseSchema = TokenResponseSchema

export type RefreshTokenApiV1UsersRefreshPostResponse = z.infer<typeof RefreshTokenApiV1UsersRefreshPostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/refresh
 * Status: 422
 * Validation Error
 */
export const RefreshTokenApiV1UsersRefreshPostErrorSchema = HTTPValidationErrorSchema

export type RefreshTokenApiV1UsersRefreshPostError = z.infer<typeof RefreshTokenApiV1UsersRefreshPostErrorSchema>
/**
 * Success response schema for GET /api/v1/users/me
 * Status: 200
 * Successful Response
 */
export const GetCurrentUserInfoApiV1UsersMeGetResponseSchema = UserResponseSchema

export type GetCurrentUserInfoApiV1UsersMeGetResponse = z.infer<typeof GetCurrentUserInfoApiV1UsersMeGetResponseSchema>
/**
 * Request schema for PUT /api/v1/users/me
 */
export const UpdateCurrentUserApiV1UsersMePutRequestSchema = UserUpdateSchema
export type UpdateCurrentUserApiV1UsersMePutRequest = z.infer<typeof UpdateCurrentUserApiV1UsersMePutRequestSchema>
/**
 * Success response schema for PUT /api/v1/users/me
 * Status: 200
 * Successful Response
 */
export const UpdateCurrentUserApiV1UsersMePutResponseSchema = UserResponseSchema

export type UpdateCurrentUserApiV1UsersMePutResponse = z.infer<typeof UpdateCurrentUserApiV1UsersMePutResponseSchema>
/**
 * Error response schema for PUT /api/v1/users/me
 * Status: 422
 * Validation Error
 */
export const UpdateCurrentUserApiV1UsersMePutErrorSchema = HTTPValidationErrorSchema

export type UpdateCurrentUserApiV1UsersMePutError = z.infer<typeof UpdateCurrentUserApiV1UsersMePutErrorSchema>
/**
 * Request schema for POST /api/v1/users/otp/request
 */
export const RequestOtpApiV1UsersOtpRequestPostRequestSchema = OTPRequestSchema
export type RequestOtpApiV1UsersOtpRequestPostRequest = z.infer<typeof RequestOtpApiV1UsersOtpRequestPostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/otp/request
 * Status: 200
 * Successful Response
 */
export const RequestOtpApiV1UsersOtpRequestPostResponseSchema = z.any()

export type RequestOtpApiV1UsersOtpRequestPostResponse = z.infer<typeof RequestOtpApiV1UsersOtpRequestPostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/otp/request
 * Status: 422
 * Validation Error
 */
export const RequestOtpApiV1UsersOtpRequestPostErrorSchema = HTTPValidationErrorSchema

export type RequestOtpApiV1UsersOtpRequestPostError = z.infer<typeof RequestOtpApiV1UsersOtpRequestPostErrorSchema>
/**
 * Request schema for POST /api/v1/users/otp/verify
 */
export const VerifyOtpApiV1UsersOtpVerifyPostRequestSchema = OTPVerifySchema
export type VerifyOtpApiV1UsersOtpVerifyPostRequest = z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/otp/verify
 * Status: 200
 * Successful Response
 */
export const VerifyOtpApiV1UsersOtpVerifyPostResponseSchema = z.any()

export type VerifyOtpApiV1UsersOtpVerifyPostResponse = z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/otp/verify
 * Status: 422
 * Validation Error
 */
export const VerifyOtpApiV1UsersOtpVerifyPostErrorSchema = HTTPValidationErrorSchema

export type VerifyOtpApiV1UsersOtpVerifyPostError = z.infer<typeof VerifyOtpApiV1UsersOtpVerifyPostErrorSchema>
/**
 * Success response schema for POST /api/v1/users/logout
 * Status: 200
 * Successful Response
 */
export const LogoutApiV1UsersLogoutPostResponseSchema = z.any()

export type LogoutApiV1UsersLogoutPostResponse = z.infer<typeof LogoutApiV1UsersLogoutPostResponseSchema>
/**
 * Success response schema for GET /api/v1/users/sessions
 * Status: 200
 * Successful Response
 */
export const GetSessionsApiV1UsersSessionsGetResponseSchema = z.array(z.record(z.string(), z.any()))

export type GetSessionsApiV1UsersSessionsGetResponse = z.infer<typeof GetSessionsApiV1UsersSessionsGetResponseSchema>
/**
 * Success response schema for DELETE /api/v1/users/sessions/{session_id}
 * Status: 200
 * Successful Response
 */
export const RevokeSessionApiV1UsersSessionsSessionIdDeleteResponseSchema = z.any()

export type RevokeSessionApiV1UsersSessionsSessionIdDeleteResponse = z.infer<typeof RevokeSessionApiV1UsersSessionsSessionIdDeleteResponseSchema>
/**
 * Error response schema for DELETE /api/v1/users/sessions/{session_id}
 * Status: 422
 * Validation Error
 */
export const RevokeSessionApiV1UsersSessionsSessionIdDeleteErrorSchema = HTTPValidationErrorSchema

export type RevokeSessionApiV1UsersSessionsSessionIdDeleteError = z.infer<typeof RevokeSessionApiV1UsersSessionsSessionIdDeleteErrorSchema>
/**
 * Parameters schema for DELETE /api/v1/users/sessions/{session_id}
 * Path params: session_id
 * Query params: none
 * Header params: none
 */
export const RevokeSessionApiV1UsersSessionsSessionIdDeleteParamsSchema = z.object({
  path: z.object({
    session_id: z.string()
  })
})

export type RevokeSessionApiV1UsersSessionsSessionIdDeleteParams = z.infer<typeof RevokeSessionApiV1UsersSessionsSessionIdDeleteParamsSchema>
/**
 * Success response schema for POST /api/v1/users/logout-all
 * Status: 200
 * Successful Response
 */
export const LogoutAllApiV1UsersLogoutAllPostResponseSchema = z.any()

export type LogoutAllApiV1UsersLogoutAllPostResponse = z.infer<typeof LogoutAllApiV1UsersLogoutAllPostResponseSchema>
/**
 * Request schema for POST /api/v1/users/oauth/login
 */
export const OauthLoginApiV1UsersOauthLoginPostRequestSchema = OAuthLoginSchema
export type OauthLoginApiV1UsersOauthLoginPostRequest = z.infer<typeof OauthLoginApiV1UsersOauthLoginPostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/oauth/login
 * Status: 200
 * Successful Response
 */
export const OauthLoginApiV1UsersOauthLoginPostResponseSchema = AuthResponseSchema

export type OauthLoginApiV1UsersOauthLoginPostResponse = z.infer<typeof OauthLoginApiV1UsersOauthLoginPostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/oauth/login
 * Status: 422
 * Validation Error
 */
export const OauthLoginApiV1UsersOauthLoginPostErrorSchema = HTTPValidationErrorSchema

export type OauthLoginApiV1UsersOauthLoginPostError = z.infer<typeof OauthLoginApiV1UsersOauthLoginPostErrorSchema>
/**
 * Request schema for POST /api/v1/users/password/reset/request
 */
export const RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema = PasswordResetRequestSchema
export type RequestPasswordResetApiV1UsersPasswordResetRequestPostRequest = z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/password/reset/request
 * Status: 200
 * Successful Response
 */
export const RequestPasswordResetApiV1UsersPasswordResetRequestPostResponseSchema = z.any()

export type RequestPasswordResetApiV1UsersPasswordResetRequestPostResponse = z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/password/reset/request
 * Status: 422
 * Validation Error
 */
export const RequestPasswordResetApiV1UsersPasswordResetRequestPostErrorSchema = HTTPValidationErrorSchema

export type RequestPasswordResetApiV1UsersPasswordResetRequestPostError = z.infer<typeof RequestPasswordResetApiV1UsersPasswordResetRequestPostErrorSchema>
/**
 * Request schema for POST /api/v1/users/password/reset
 */
export const ResetPasswordApiV1UsersPasswordResetPostRequestSchema = PasswordResetSchema
export type ResetPasswordApiV1UsersPasswordResetPostRequest = z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/password/reset
 * Status: 200
 * Successful Response
 */
export const ResetPasswordApiV1UsersPasswordResetPostResponseSchema = z.any()

export type ResetPasswordApiV1UsersPasswordResetPostResponse = z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/password/reset
 * Status: 422
 * Validation Error
 */
export const ResetPasswordApiV1UsersPasswordResetPostErrorSchema = HTTPValidationErrorSchema

export type ResetPasswordApiV1UsersPasswordResetPostError = z.infer<typeof ResetPasswordApiV1UsersPasswordResetPostErrorSchema>
/**
 * Request schema for POST /api/v1/users/password/change
 */
export const ChangePasswordApiV1UsersPasswordChangePostRequestSchema = PasswordChangeSchema
export type ChangePasswordApiV1UsersPasswordChangePostRequest = z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/password/change
 * Status: 200
 * Successful Response
 */
export const ChangePasswordApiV1UsersPasswordChangePostResponseSchema = z.any()

export type ChangePasswordApiV1UsersPasswordChangePostResponse = z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/password/change
 * Status: 422
 * Validation Error
 */
export const ChangePasswordApiV1UsersPasswordChangePostErrorSchema = HTTPValidationErrorSchema

export type ChangePasswordApiV1UsersPasswordChangePostError = z.infer<typeof ChangePasswordApiV1UsersPasswordChangePostErrorSchema>
/**
 * Request schema for POST /api/v1/users/email/verify
 */
export const VerifyEmailApiV1UsersEmailVerifyPostRequestSchema = EmailVerificationRequestSchema
export type VerifyEmailApiV1UsersEmailVerifyPostRequest = z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/email/verify
 * Status: 200
 * Successful Response
 */
export const VerifyEmailApiV1UsersEmailVerifyPostResponseSchema = z.any()

export type VerifyEmailApiV1UsersEmailVerifyPostResponse = z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/email/verify
 * Status: 422
 * Validation Error
 */
export const VerifyEmailApiV1UsersEmailVerifyPostErrorSchema = HTTPValidationErrorSchema

export type VerifyEmailApiV1UsersEmailVerifyPostError = z.infer<typeof VerifyEmailApiV1UsersEmailVerifyPostErrorSchema>
/**
 * Request schema for POST /api/v1/users/email/resend-verification
 */
export const ResendEmailVerificationApiV1UsersEmailResendVerificationPostRequestSchema = ResendEmailVerificationRequestSchema
export type ResendEmailVerificationApiV1UsersEmailResendVerificationPostRequest = z.infer<typeof ResendEmailVerificationApiV1UsersEmailResendVerificationPostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/email/resend-verification
 * Status: 200
 * Successful Response
 */
export const ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema = z.any()

export type ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponse = z.infer<typeof ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/email/resend-verification
 * Status: 422
 * Validation Error
 */
export const ResendEmailVerificationApiV1UsersEmailResendVerificationPostErrorSchema = HTTPValidationErrorSchema

export type ResendEmailVerificationApiV1UsersEmailResendVerificationPostError = z.infer<typeof ResendEmailVerificationApiV1UsersEmailResendVerificationPostErrorSchema>
/**
 * Request schema for POST /api/v1/users/login/2fa/verify
 */
export const Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema = TwoFactorLoginVerifySchema
export type Verify2faLoginApiV1UsersLogin2faVerifyPostRequest = z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/login/2fa/verify
 * Status: 200
 * Successful Response
 */
export const Verify2faLoginApiV1UsersLogin2faVerifyPostResponseSchema = AuthResponseSchema

export type Verify2faLoginApiV1UsersLogin2faVerifyPostResponse = z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/login/2fa/verify
 * Status: 422
 * Validation Error
 */
export const Verify2faLoginApiV1UsersLogin2faVerifyPostErrorSchema = HTTPValidationErrorSchema

export type Verify2faLoginApiV1UsersLogin2faVerifyPostError = z.infer<typeof Verify2faLoginApiV1UsersLogin2faVerifyPostErrorSchema>
/**
 * Success response schema for POST /api/v1/users/2fa/setup
 * Status: 200
 * Successful Response
 */
export const Setup2faApiV1Users2faSetupPostResponseSchema = TwoFactorSetupResponseSchema

export type Setup2faApiV1Users2faSetupPostResponse = z.infer<typeof Setup2faApiV1Users2faSetupPostResponseSchema>
/**
 * Request schema for POST /api/v1/users/2fa/verify
 */
export const Verify2faSetupApiV1Users2faVerifyPostRequestSchema = TwoFactorVerifyRequestSchema
export type Verify2faSetupApiV1Users2faVerifyPostRequest = z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/2fa/verify
 * Status: 200
 * Successful Response
 */
export const Verify2faSetupApiV1Users2faVerifyPostResponseSchema = z.any()

export type Verify2faSetupApiV1Users2faVerifyPostResponse = z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/2fa/verify
 * Status: 422
 * Validation Error
 */
export const Verify2faSetupApiV1Users2faVerifyPostErrorSchema = HTTPValidationErrorSchema

export type Verify2faSetupApiV1Users2faVerifyPostError = z.infer<typeof Verify2faSetupApiV1Users2faVerifyPostErrorSchema>
/**
 * Success response schema for GET /api/v1/users/2fa/status
 * Status: 200
 * Successful Response
 */
export const Get2faStatusApiV1Users2faStatusGetResponseSchema = TwoFactorStatusResponseSchema

export type Get2faStatusApiV1Users2faStatusGetResponse = z.infer<typeof Get2faStatusApiV1Users2faStatusGetResponseSchema>
/**
 * Request schema for POST /api/v1/users/2fa/disable
 */
export const Disable2faApiV1Users2faDisablePostRequestSchema = PasswordChangeSchema
export type Disable2faApiV1Users2faDisablePostRequest = z.infer<typeof Disable2faApiV1Users2faDisablePostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/2fa/disable
 * Status: 200
 * Successful Response
 */
export const Disable2faApiV1Users2faDisablePostResponseSchema = z.any()

export type Disable2faApiV1Users2faDisablePostResponse = z.infer<typeof Disable2faApiV1Users2faDisablePostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/2fa/disable
 * Status: 422
 * Validation Error
 */
export const Disable2faApiV1Users2faDisablePostErrorSchema = HTTPValidationErrorSchema

export type Disable2faApiV1Users2faDisablePostError = z.infer<typeof Disable2faApiV1Users2faDisablePostErrorSchema>
/**
 * Success response schema for POST /api/v1/users/2fa/backup-codes/regenerate
 * Status: 200
 * Successful Response
 */
export const RegenerateBackupCodesApiV1Users2faBackupCodesRegeneratePostResponseSchema = z.any()

export type RegenerateBackupCodesApiV1Users2faBackupCodesRegeneratePostResponse = z.infer<typeof RegenerateBackupCodesApiV1Users2faBackupCodesRegeneratePostResponseSchema>
/**
 * Success response schema for GET /api/v1/users/data-export
 * Status: 200
 * Successful Response
 */
export const ExportUserDataApiV1UsersDataExportGetResponseSchema = DataExportResponseSchema

export type ExportUserDataApiV1UsersDataExportGetResponse = z.infer<typeof ExportUserDataApiV1UsersDataExportGetResponseSchema>
/**
 * Request schema for POST /api/v1/users/account/delete
 */
export const DeleteAccountApiV1UsersAccountDeletePostRequestSchema = AccountDeletionRequestSchema
export type DeleteAccountApiV1UsersAccountDeletePostRequest = z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostRequestSchema>
/**
 * Success response schema for POST /api/v1/users/account/delete
 * Status: 200
 * Successful Response
 */
export const DeleteAccountApiV1UsersAccountDeletePostResponseSchema = z.any()

export type DeleteAccountApiV1UsersAccountDeletePostResponse = z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostResponseSchema>
/**
 * Error response schema for POST /api/v1/users/account/delete
 * Status: 422
 * Validation Error
 */
export const DeleteAccountApiV1UsersAccountDeletePostErrorSchema = HTTPValidationErrorSchema

export type DeleteAccountApiV1UsersAccountDeletePostError = z.infer<typeof DeleteAccountApiV1UsersAccountDeletePostErrorSchema>
/**
 * Success response schema for GET /api/v1/listings
 * Status: 200
 * Successful Response
 */
export const ListListingsApiV1ListingsGetResponseSchema = ListingListResponseSchema

export type ListListingsApiV1ListingsGetResponse = z.infer<typeof ListListingsApiV1ListingsGetResponseSchema>
/**
 * Error response schema for GET /api/v1/listings
 * Status: 422
 * Validation Error
 */
export const ListListingsApiV1ListingsGetErrorSchema = HTTPValidationErrorSchema

export type ListListingsApiV1ListingsGetError = z.infer<typeof ListListingsApiV1ListingsGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/listings
 * Path params: none
 * Query params: skip, limit, city, country, listing_type, min_price, max_price, min_guests, status
 * Header params: none
 */
export const ListListingsApiV1ListingsGetParamsSchema = z.object({
  query: z.object({
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional(),
    city: z.any().optional(),
    country: z.any().optional(),
    listing_type: z.any().optional(),
    min_price: z.any().optional(),
    max_price: z.any().optional(),
    min_guests: z.any().optional(),
    status: z.any().optional()
  }).optional()
})

export type ListListingsApiV1ListingsGetParams = z.infer<typeof ListListingsApiV1ListingsGetParamsSchema>
/**
 * Request schema for POST /api/v1/listings
 */
export const CreateListingApiV1ListingsPostRequestSchema = ListingCreateSchema
export type CreateListingApiV1ListingsPostRequest = z.infer<typeof CreateListingApiV1ListingsPostRequestSchema>
/**
 * Success response schema for POST /api/v1/listings
 * Status: 201
 * Successful Response
 */
export const CreateListingApiV1ListingsPostResponseSchema = ListingResponseSchema

export type CreateListingApiV1ListingsPostResponse = z.infer<typeof CreateListingApiV1ListingsPostResponseSchema>
/**
 * Error response schema for POST /api/v1/listings
 * Status: 422
 * Validation Error
 */
export const CreateListingApiV1ListingsPostErrorSchema = HTTPValidationErrorSchema

export type CreateListingApiV1ListingsPostError = z.infer<typeof CreateListingApiV1ListingsPostErrorSchema>
/**
 * Success response schema for GET /api/v1/listings/{listing_id}
 * Status: 200
 * Successful Response
 */
export const GetListingApiV1ListingsListingIdGetResponseSchema = z.any()

export type GetListingApiV1ListingsListingIdGetResponse = z.infer<typeof GetListingApiV1ListingsListingIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/listings/{listing_id}
 * Status: 422
 * Validation Error
 */
export const GetListingApiV1ListingsListingIdGetErrorSchema = HTTPValidationErrorSchema

export type GetListingApiV1ListingsListingIdGetError = z.infer<typeof GetListingApiV1ListingsListingIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/listings/{listing_id}
 * Path params: listing_id
 * Query params: none
 * Header params: none
 */
export const GetListingApiV1ListingsListingIdGetParamsSchema = z.object({
  path: z.object({
    listing_id: z.string().max(40, "Maximum length is 40")
  })
})

export type GetListingApiV1ListingsListingIdGetParams = z.infer<typeof GetListingApiV1ListingsListingIdGetParamsSchema>
/**
 * Request schema for PUT /api/v1/listings/{listing_id}
 */
export const UpdateListingApiV1ListingsListingIdPutRequestSchema = ListingUpdateSchema
export type UpdateListingApiV1ListingsListingIdPutRequest = z.infer<typeof UpdateListingApiV1ListingsListingIdPutRequestSchema>
/**
 * Success response schema for PUT /api/v1/listings/{listing_id}
 * Status: 200
 * Successful Response
 */
export const UpdateListingApiV1ListingsListingIdPutResponseSchema = ListingResponseSchema

export type UpdateListingApiV1ListingsListingIdPutResponse = z.infer<typeof UpdateListingApiV1ListingsListingIdPutResponseSchema>
/**
 * Error response schema for PUT /api/v1/listings/{listing_id}
 * Status: 422
 * Validation Error
 */
export const UpdateListingApiV1ListingsListingIdPutErrorSchema = HTTPValidationErrorSchema

export type UpdateListingApiV1ListingsListingIdPutError = z.infer<typeof UpdateListingApiV1ListingsListingIdPutErrorSchema>
/**
 * Parameters schema for PUT /api/v1/listings/{listing_id}
 * Path params: listing_id
 * Query params: none
 * Header params: none
 */
export const UpdateListingApiV1ListingsListingIdPutParamsSchema = z.object({
  path: z.object({
    listing_id: z.string().max(40, "Maximum length is 40")
  })
})

export type UpdateListingApiV1ListingsListingIdPutParams = z.infer<typeof UpdateListingApiV1ListingsListingIdPutParamsSchema>
/**
 * Success response schema for DELETE /api/v1/listings/{listing_id}
 * Status: 200
 * Successful Response
 */
export const DeleteListingApiV1ListingsListingIdDeleteResponseSchema = z.void()

export type DeleteListingApiV1ListingsListingIdDeleteResponse = z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteResponseSchema>
/**
 * Error response schema for DELETE /api/v1/listings/{listing_id}
 * Status: 422
 * Validation Error
 */
export const DeleteListingApiV1ListingsListingIdDeleteErrorSchema = HTTPValidationErrorSchema

export type DeleteListingApiV1ListingsListingIdDeleteError = z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteErrorSchema>
/**
 * Parameters schema for DELETE /api/v1/listings/{listing_id}
 * Path params: listing_id
 * Query params: none
 * Header params: none
 */
export const DeleteListingApiV1ListingsListingIdDeleteParamsSchema = z.object({
  path: z.object({
    listing_id: z.string().max(40, "Maximum length is 40")
  })
})

export type DeleteListingApiV1ListingsListingIdDeleteParams = z.infer<typeof DeleteListingApiV1ListingsListingIdDeleteParamsSchema>
/**
 * Request schema for POST /api/v1/listings/{listing_id}/location
 */
export const CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema = ListingLocationCreateSchema
export type CreateListingLocationApiV1ListingsListingIdLocationPostRequest = z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostRequestSchema>
/**
 * Success response schema for POST /api/v1/listings/{listing_id}/location
 * Status: 200
 * Successful Response
 */
export const CreateListingLocationApiV1ListingsListingIdLocationPostResponseSchema = ListingResponseSchema

export type CreateListingLocationApiV1ListingsListingIdLocationPostResponse = z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostResponseSchema>
/**
 * Error response schema for POST /api/v1/listings/{listing_id}/location
 * Status: 422
 * Validation Error
 */
export const CreateListingLocationApiV1ListingsListingIdLocationPostErrorSchema = HTTPValidationErrorSchema

export type CreateListingLocationApiV1ListingsListingIdLocationPostError = z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/listings/{listing_id}/location
 * Path params: listing_id
 * Query params: none
 * Header params: none
 */
export const CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema = z.object({
  path: z.object({
    listing_id: z.string().max(40, "Maximum length is 40")
  })
})

export type CreateListingLocationApiV1ListingsListingIdLocationPostParams = z.infer<typeof CreateListingLocationApiV1ListingsListingIdLocationPostParamsSchema>
/**
 * Success response schema for GET /api/v1/ai/travel-planner
 * Status: 200
 * Successful Response
 */
export const ListTravelPlansApiV1AiTravelPlannerGetResponseSchema = z.array(TravelPlanResponseSchema)

export type ListTravelPlansApiV1AiTravelPlannerGetResponse = z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetResponseSchema>
/**
 * Error response schema for GET /api/v1/ai/travel-planner
 * Status: 422
 * Validation Error
 */
export const ListTravelPlansApiV1AiTravelPlannerGetErrorSchema = HTTPValidationErrorSchema

export type ListTravelPlansApiV1AiTravelPlannerGetError = z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/ai/travel-planner
 * Path params: none
 * Query params: skip, limit
 * Header params: none
 */
export const ListTravelPlansApiV1AiTravelPlannerGetParamsSchema = z.object({
  query: z.object({
    skip: z.number().int().optional(),
    limit: z.number().int().optional()
  }).optional()
})

export type ListTravelPlansApiV1AiTravelPlannerGetParams = z.infer<typeof ListTravelPlansApiV1AiTravelPlannerGetParamsSchema>
/**
 * Request schema for POST /api/v1/ai/travel-planner
 */
export const CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema = TravelPlanRequestSchema
export type CreateTravelPlanApiV1AiTravelPlannerPostRequest = z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostRequestSchema>
/**
 * Success response schema for POST /api/v1/ai/travel-planner
 * Status: 201
 * Successful Response
 */
export const CreateTravelPlanApiV1AiTravelPlannerPostResponseSchema = TravelPlanResponseSchema

export type CreateTravelPlanApiV1AiTravelPlannerPostResponse = z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostResponseSchema>
/**
 * Error response schema for POST /api/v1/ai/travel-planner
 * Status: 422
 * Validation Error
 */
export const CreateTravelPlanApiV1AiTravelPlannerPostErrorSchema = HTTPValidationErrorSchema

export type CreateTravelPlanApiV1AiTravelPlannerPostError = z.infer<typeof CreateTravelPlanApiV1AiTravelPlannerPostErrorSchema>
/**
 * Success response schema for GET /api/v1/ai/travel-planner/{plan_id}
 * Status: 200
 * Successful Response
 */
export const GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema = TravelPlanResponseSchema

export type GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponse = z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/ai/travel-planner/{plan_id}
 * Status: 422
 * Validation Error
 */
export const GetTravelPlanApiV1AiTravelPlannerPlanIdGetErrorSchema = HTTPValidationErrorSchema

export type GetTravelPlanApiV1AiTravelPlannerPlanIdGetError = z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/ai/travel-planner/{plan_id}
 * Path params: plan_id
 * Query params: none
 * Header params: none
 */
export const GetTravelPlanApiV1AiTravelPlannerPlanIdGetParamsSchema = z.object({
  path: z.object({
    plan_id: z.string().max(40, "Maximum length is 40")
  })
})

export type GetTravelPlanApiV1AiTravelPlannerPlanIdGetParams = z.infer<typeof GetTravelPlanApiV1AiTravelPlannerPlanIdGetParamsSchema>
/**
 * Request schema for POST /api/v1/files/upload
 */
export const UploadFileApiV1FilesUploadPostRequestSchema = BodyUploadFileApiV1FilesUploadPostSchema
export type UploadFileApiV1FilesUploadPostRequest = z.infer<typeof UploadFileApiV1FilesUploadPostRequestSchema>
/**
 * Success response schema for POST /api/v1/files/upload
 * Status: 201
 * Successful Response
 */
export const UploadFileApiV1FilesUploadPostResponseSchema = FileUploadResponseSchema

export type UploadFileApiV1FilesUploadPostResponse = z.infer<typeof UploadFileApiV1FilesUploadPostResponseSchema>
/**
 * Error response schema for POST /api/v1/files/upload
 * Status: 422
 * Validation Error
 */
export const UploadFileApiV1FilesUploadPostErrorSchema = HTTPValidationErrorSchema

export type UploadFileApiV1FilesUploadPostError = z.infer<typeof UploadFileApiV1FilesUploadPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/files/upload
 * Path params: none
 * Query params: category
 * Header params: none
 */
export const UploadFileApiV1FilesUploadPostParamsSchema = z.object({
  query: z.object({
    category: FileCategorySchema.optional()
  }).optional()
})

export type UploadFileApiV1FilesUploadPostParams = z.infer<typeof UploadFileApiV1FilesUploadPostParamsSchema>
/**
 * Request schema for POST /api/v1/files/upload-multiple
 */
export const UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema = BodyUploadMultipleFilesApiV1FilesUploadMultiplePostSchema
export type UploadMultipleFilesApiV1FilesUploadMultiplePostRequest = z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostRequestSchema>
/**
 * Success response schema for POST /api/v1/files/upload-multiple
 * Status: 201
 * Successful Response
 */
export const UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema = z.record(z.string(), z.any())

export type UploadMultipleFilesApiV1FilesUploadMultiplePostResponse = z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostResponseSchema>
/**
 * Error response schema for POST /api/v1/files/upload-multiple
 * Status: 422
 * Validation Error
 */
export const UploadMultipleFilesApiV1FilesUploadMultiplePostErrorSchema = HTTPValidationErrorSchema

export type UploadMultipleFilesApiV1FilesUploadMultiplePostError = z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostErrorSchema>
/**
 * Parameters schema for POST /api/v1/files/upload-multiple
 * Path params: none
 * Query params: category
 * Header params: none
 */
export const UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema = z.object({
  query: z.object({
    category: FileCategorySchema.optional()
  }).optional()
})

export type UploadMultipleFilesApiV1FilesUploadMultiplePostParams = z.infer<typeof UploadMultipleFilesApiV1FilesUploadMultiplePostParamsSchema>
/**
 * Success response schema for GET /api/v1/bookings
 * Status: 200
 * Successful Response
 */
export const ListBookingsApiV1BookingsGetResponseSchema = BookingListResponseSchema

export type ListBookingsApiV1BookingsGetResponse = z.infer<typeof ListBookingsApiV1BookingsGetResponseSchema>
/**
 * Error response schema for GET /api/v1/bookings
 * Status: 422
 * Validation Error
 */
export const ListBookingsApiV1BookingsGetErrorSchema = HTTPValidationErrorSchema

export type ListBookingsApiV1BookingsGetError = z.infer<typeof ListBookingsApiV1BookingsGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/bookings
 * Path params: none
 * Query params: skip, limit, status
 * Header params: none
 */
export const ListBookingsApiV1BookingsGetParamsSchema = z.object({
  query: z.object({
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional(),
    status: z.any().optional()
  }).optional()
})

export type ListBookingsApiV1BookingsGetParams = z.infer<typeof ListBookingsApiV1BookingsGetParamsSchema>
/**
 * Request schema for POST /api/v1/bookings
 */
export const CreateBookingApiV1BookingsPostRequestSchema = BookingCreateSchema
export type CreateBookingApiV1BookingsPostRequest = z.infer<typeof CreateBookingApiV1BookingsPostRequestSchema>
/**
 * Success response schema for POST /api/v1/bookings
 * Status: 201
 * Successful Response
 */
export const CreateBookingApiV1BookingsPostResponseSchema = BookingResponseSchema

export type CreateBookingApiV1BookingsPostResponse = z.infer<typeof CreateBookingApiV1BookingsPostResponseSchema>
/**
 * Error response schema for POST /api/v1/bookings
 * Status: 422
 * Validation Error
 */
export const CreateBookingApiV1BookingsPostErrorSchema = HTTPValidationErrorSchema

export type CreateBookingApiV1BookingsPostError = z.infer<typeof CreateBookingApiV1BookingsPostErrorSchema>
/**
 * Success response schema for GET /api/v1/bookings/{booking_id}
 * Status: 200
 * Successful Response
 */
export const GetBookingApiV1BookingsBookingIdGetResponseSchema = BookingResponseSchema

export type GetBookingApiV1BookingsBookingIdGetResponse = z.infer<typeof GetBookingApiV1BookingsBookingIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/bookings/{booking_id}
 * Status: 422
 * Validation Error
 */
export const GetBookingApiV1BookingsBookingIdGetErrorSchema = HTTPValidationErrorSchema

export type GetBookingApiV1BookingsBookingIdGetError = z.infer<typeof GetBookingApiV1BookingsBookingIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/bookings/{booking_id}
 * Path params: booking_id
 * Query params: none
 * Header params: none
 */
export const GetBookingApiV1BookingsBookingIdGetParamsSchema = z.object({
  path: z.object({
    booking_id: z.string().max(40, "Maximum length is 40")
  })
})

export type GetBookingApiV1BookingsBookingIdGetParams = z.infer<typeof GetBookingApiV1BookingsBookingIdGetParamsSchema>
/**
 * Request schema for POST /api/v1/bookings/{booking_id}/cancel
 */
export const CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema = BookingCancelSchema
export type CancelBookingApiV1BookingsBookingIdCancelPostRequest = z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostRequestSchema>
/**
 * Success response schema for POST /api/v1/bookings/{booking_id}/cancel
 * Status: 200
 * Successful Response
 */
export const CancelBookingApiV1BookingsBookingIdCancelPostResponseSchema = BookingResponseSchema

export type CancelBookingApiV1BookingsBookingIdCancelPostResponse = z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostResponseSchema>
/**
 * Error response schema for POST /api/v1/bookings/{booking_id}/cancel
 * Status: 422
 * Validation Error
 */
export const CancelBookingApiV1BookingsBookingIdCancelPostErrorSchema = HTTPValidationErrorSchema

export type CancelBookingApiV1BookingsBookingIdCancelPostError = z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/bookings/{booking_id}/cancel
 * Path params: booking_id
 * Query params: none
 * Header params: none
 */
export const CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema = z.object({
  path: z.object({
    booking_id: z.string().max(40, "Maximum length is 40")
  })
})

export type CancelBookingApiV1BookingsBookingIdCancelPostParams = z.infer<typeof CancelBookingApiV1BookingsBookingIdCancelPostParamsSchema>
/**
 * Success response schema for POST /api/v1/bookings/{booking_id}/confirm
 * Status: 200
 * Successful Response
 */
export const ConfirmBookingApiV1BookingsBookingIdConfirmPostResponseSchema = BookingResponseSchema

export type ConfirmBookingApiV1BookingsBookingIdConfirmPostResponse = z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostResponseSchema>
/**
 * Error response schema for POST /api/v1/bookings/{booking_id}/confirm
 * Status: 422
 * Validation Error
 */
export const ConfirmBookingApiV1BookingsBookingIdConfirmPostErrorSchema = HTTPValidationErrorSchema

export type ConfirmBookingApiV1BookingsBookingIdConfirmPostError = z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/bookings/{booking_id}/confirm
 * Path params: booking_id
 * Query params: none
 * Header params: none
 */
export const ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema = z.object({
  path: z.object({
    booking_id: z.string().max(40, "Maximum length is 40")
  })
})

export type ConfirmBookingApiV1BookingsBookingIdConfirmPostParams = z.infer<typeof ConfirmBookingApiV1BookingsBookingIdConfirmPostParamsSchema>
/**
 * Success response schema for POST /api/v1/bookings/{booking_id}/complete
 * Status: 200
 * Successful Response
 */
export const CompleteBookingApiV1BookingsBookingIdCompletePostResponseSchema = BookingResponseSchema

export type CompleteBookingApiV1BookingsBookingIdCompletePostResponse = z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostResponseSchema>
/**
 * Error response schema for POST /api/v1/bookings/{booking_id}/complete
 * Status: 422
 * Validation Error
 */
export const CompleteBookingApiV1BookingsBookingIdCompletePostErrorSchema = HTTPValidationErrorSchema

export type CompleteBookingApiV1BookingsBookingIdCompletePostError = z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostErrorSchema>
/**
 * Parameters schema for POST /api/v1/bookings/{booking_id}/complete
 * Path params: booking_id
 * Query params: none
 * Header params: none
 */
export const CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema = z.object({
  path: z.object({
    booking_id: z.string().max(40, "Maximum length is 40")
  })
})

export type CompleteBookingApiV1BookingsBookingIdCompletePostParams = z.infer<typeof CompleteBookingApiV1BookingsBookingIdCompletePostParamsSchema>
/**
 * Success response schema for GET /api/v1/bookings/host/listings
 * Status: 200
 * Successful Response
 */
export const ListHostBookingsApiV1BookingsHostListingsGetResponseSchema = BookingListResponseSchema

export type ListHostBookingsApiV1BookingsHostListingsGetResponse = z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetResponseSchema>
/**
 * Error response schema for GET /api/v1/bookings/host/listings
 * Status: 422
 * Validation Error
 */
export const ListHostBookingsApiV1BookingsHostListingsGetErrorSchema = HTTPValidationErrorSchema

export type ListHostBookingsApiV1BookingsHostListingsGetError = z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/bookings/host/listings
 * Path params: none
 * Query params: skip, limit, status
 * Header params: none
 */
export const ListHostBookingsApiV1BookingsHostListingsGetParamsSchema = z.object({
  query: z.object({
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional(),
    status: z.any().optional()
  }).optional()
})

export type ListHostBookingsApiV1BookingsHostListingsGetParams = z.infer<typeof ListHostBookingsApiV1BookingsHostListingsGetParamsSchema>
/**
 * Request schema for POST /api/v1/reviews
 */
export const CreateReviewApiV1ReviewsPostRequestSchema = ReviewCreateSchema
export type CreateReviewApiV1ReviewsPostRequest = z.infer<typeof CreateReviewApiV1ReviewsPostRequestSchema>
/**
 * Success response schema for POST /api/v1/reviews
 * Status: 201
 * Successful Response
 */
export const CreateReviewApiV1ReviewsPostResponseSchema = ReviewResponseSchema

export type CreateReviewApiV1ReviewsPostResponse = z.infer<typeof CreateReviewApiV1ReviewsPostResponseSchema>
/**
 * Error response schema for POST /api/v1/reviews
 * Status: 422
 * Validation Error
 */
export const CreateReviewApiV1ReviewsPostErrorSchema = HTTPValidationErrorSchema

export type CreateReviewApiV1ReviewsPostError = z.infer<typeof CreateReviewApiV1ReviewsPostErrorSchema>
/**
 * Success response schema for GET /api/v1/reviews/listings/{listing_id}
 * Status: 200
 * Successful Response
 */
export const GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema = ReviewListResponseSchema

export type GetListingReviewsApiV1ReviewsListingsListingIdGetResponse = z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/reviews/listings/{listing_id}
 * Status: 422
 * Validation Error
 */
export const GetListingReviewsApiV1ReviewsListingsListingIdGetErrorSchema = HTTPValidationErrorSchema

export type GetListingReviewsApiV1ReviewsListingsListingIdGetError = z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/reviews/listings/{listing_id}
 * Path params: listing_id
 * Query params: skip, limit
 * Header params: none
 */
export const GetListingReviewsApiV1ReviewsListingsListingIdGetParamsSchema = z.object({
  path: z.object({
    listing_id: z.string().max(40, "Maximum length is 40")
  }),
  query: z.object({
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional()
  }).optional()
})

export type GetListingReviewsApiV1ReviewsListingsListingIdGetParams = z.infer<typeof GetListingReviewsApiV1ReviewsListingsListingIdGetParamsSchema>
/**
 * Success response schema for GET /api/v1/reviews/{review_id}
 * Status: 200
 * Successful Response
 */
export const GetReviewApiV1ReviewsReviewIdGetResponseSchema = ReviewResponseSchema

export type GetReviewApiV1ReviewsReviewIdGetResponse = z.infer<typeof GetReviewApiV1ReviewsReviewIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/reviews/{review_id}
 * Status: 422
 * Validation Error
 */
export const GetReviewApiV1ReviewsReviewIdGetErrorSchema = HTTPValidationErrorSchema

export type GetReviewApiV1ReviewsReviewIdGetError = z.infer<typeof GetReviewApiV1ReviewsReviewIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/reviews/{review_id}
 * Path params: review_id
 * Query params: none
 * Header params: none
 */
export const GetReviewApiV1ReviewsReviewIdGetParamsSchema = z.object({
  path: z.object({
    review_id: z.string().max(40, "Maximum length is 40")
  })
})

export type GetReviewApiV1ReviewsReviewIdGetParams = z.infer<typeof GetReviewApiV1ReviewsReviewIdGetParamsSchema>
/**
 * Request schema for POST /api/v1/reviews/{review_id}/response
 */
export const CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema = ReviewResponseCreateSchema
export type CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequest = z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostRequestSchema>
/**
 * Success response schema for POST /api/v1/reviews/{review_id}/response
 * Status: 201
 * Successful Response
 */
export const CreateReviewResponseApiV1ReviewsReviewIdResponsePostResponseSchema = ReviewResponseResponseSchema

export type CreateReviewResponseApiV1ReviewsReviewIdResponsePostResponse = z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostResponseSchema>
/**
 * Error response schema for POST /api/v1/reviews/{review_id}/response
 * Status: 422
 * Validation Error
 */
export const CreateReviewResponseApiV1ReviewsReviewIdResponsePostErrorSchema = HTTPValidationErrorSchema

export type CreateReviewResponseApiV1ReviewsReviewIdResponsePostError = z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostErrorSchema>
/**
 * Parameters schema for POST /api/v1/reviews/{review_id}/response
 * Path params: review_id
 * Query params: none
 * Header params: none
 */
export const CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema = z.object({
  path: z.object({
    review_id: z.string().max(40, "Maximum length is 40")
  })
})

export type CreateReviewResponseApiV1ReviewsReviewIdResponsePostParams = z.infer<typeof CreateReviewResponseApiV1ReviewsReviewIdResponsePostParamsSchema>
/**
 * Request schema for POST /api/v1/reviews/{review_id}/helpful
 */
export const MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema = ReviewHelpfulRequestSchema
export type MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequest = z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostRequestSchema>
/**
 * Success response schema for POST /api/v1/reviews/{review_id}/helpful
 * Status: 200
 * Successful Response
 */
export const MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostResponseSchema = z.record(z.string(), z.any())

export type MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostResponse = z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostResponseSchema>
/**
 * Error response schema for POST /api/v1/reviews/{review_id}/helpful
 * Status: 422
 * Validation Error
 */
export const MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostErrorSchema = HTTPValidationErrorSchema

export type MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostError = z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/reviews/{review_id}/helpful
 * Path params: review_id
 * Query params: none
 * Header params: none
 */
export const MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema = z.object({
  path: z.object({
    review_id: z.string().max(40, "Maximum length is 40")
  })
})

export type MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParams = z.infer<typeof MarkReviewHelpfulApiV1ReviewsReviewIdHelpfulPostParamsSchema>
/**
 * Success response schema for GET /api/v1/search/listings
 * Status: 200
 * Successful Response
 */
export const SearchListingsApiV1SearchListingsGetResponseSchema = SearchResponseSchema

export type SearchListingsApiV1SearchListingsGetResponse = z.infer<typeof SearchListingsApiV1SearchListingsGetResponseSchema>
/**
 * Error response schema for GET /api/v1/search/listings
 * Status: 422
 * Validation Error
 */
export const SearchListingsApiV1SearchListingsGetErrorSchema = HTTPValidationErrorSchema

export type SearchListingsApiV1SearchListingsGetError = z.infer<typeof SearchListingsApiV1SearchListingsGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/search/listings
 * Path params: none
 * Query params: query, city, country, listing_type, min_price, max_price, min_guests, min_bedrooms, min_bathrooms, latitude, longitude, radius_km, skip, limit, sort_by, enable_personalization, enable_popularity_boost, enable_location_boost, ab_test_variant
 * Header params: none
 */
export const SearchListingsApiV1SearchListingsGetParamsSchema = z.object({
  query: z.object({
    query: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    listing_type: ListingTypeSchema.optional(),
    min_price: z.number().min(0, "Minimum value is 0").optional(),
    max_price: z.number().min(0, "Minimum value is 0").optional(),
    min_guests: z.number().int().min(1, "Minimum value is 1").optional(),
    min_bedrooms: z.number().int().min(0, "Minimum value is 0").optional(),
    min_bathrooms: z.number().int().min(0, "Minimum value is 0").optional(),
    latitude: z.number().min(-90, "Minimum value is -90").max(90, "Maximum value is 90").optional(),
    longitude: z.number().min(-180, "Minimum value is -180").max(180, "Maximum value is 180").optional(),
    radius_km: z.number().min(0, "Minimum value is 0").max(1000, "Maximum value is 1000").optional(),
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional(),
    sort_by: z.string().optional(),
    enable_personalization: z.boolean().optional(),
    enable_popularity_boost: z.boolean().optional(),
    enable_location_boost: z.boolean().optional(),
    ab_test_variant: z.string().optional()
  }).optional()
})

export type SearchListingsApiV1SearchListingsGetParams = z.infer<typeof SearchListingsApiV1SearchListingsGetParamsSchema>
/**
 * Success response schema for GET /api/v1/search/suggestions
 * Status: 200
 * Successful Response
 */
export const GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema = SearchSuggestionsResponseSchema

export type GetSearchSuggestionsApiV1SearchSuggestionsGetResponse = z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetResponseSchema>
/**
 * Error response schema for GET /api/v1/search/suggestions
 * Status: 422
 * Validation Error
 */
export const GetSearchSuggestionsApiV1SearchSuggestionsGetErrorSchema = HTTPValidationErrorSchema

export type GetSearchSuggestionsApiV1SearchSuggestionsGetError = z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/search/suggestions
 * Path params: none
 * Query params: query, limit
 * Header params: none
 */
export const GetSearchSuggestionsApiV1SearchSuggestionsGetParamsSchema = z.object({
  query: z.object({
    query: z.string().min(2, "Minimum length is 2"),
    limit: z.number().int().min(1, "Minimum value is 1").max(20, "Maximum value is 20").optional()
  }).optional()
})

export type GetSearchSuggestionsApiV1SearchSuggestionsGetParams = z.infer<typeof GetSearchSuggestionsApiV1SearchSuggestionsGetParamsSchema>
/**
 * Request schema for POST /api/v1/messages
 */
export const CreateMessageApiV1MessagesPostRequestSchema = MessageCreateSchema
export type CreateMessageApiV1MessagesPostRequest = z.infer<typeof CreateMessageApiV1MessagesPostRequestSchema>
/**
 * Success response schema for POST /api/v1/messages
 * Status: 201
 * Successful Response
 */
export const CreateMessageApiV1MessagesPostResponseSchema = MessageResponseSchema

export type CreateMessageApiV1MessagesPostResponse = z.infer<typeof CreateMessageApiV1MessagesPostResponseSchema>
/**
 * Error response schema for POST /api/v1/messages
 * Status: 422
 * Validation Error
 */
export const CreateMessageApiV1MessagesPostErrorSchema = HTTPValidationErrorSchema

export type CreateMessageApiV1MessagesPostError = z.infer<typeof CreateMessageApiV1MessagesPostErrorSchema>
/**
 * Success response schema for GET /api/v1/messages/conversations
 * Status: 200
 * Successful Response
 */
export const GetConversationsApiV1MessagesConversationsGetResponseSchema = ConversationListResponseSchema

export type GetConversationsApiV1MessagesConversationsGetResponse = z.infer<typeof GetConversationsApiV1MessagesConversationsGetResponseSchema>
/**
 * Error response schema for GET /api/v1/messages/conversations
 * Status: 422
 * Validation Error
 */
export const GetConversationsApiV1MessagesConversationsGetErrorSchema = HTTPValidationErrorSchema

export type GetConversationsApiV1MessagesConversationsGetError = z.infer<typeof GetConversationsApiV1MessagesConversationsGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/messages/conversations
 * Path params: none
 * Query params: skip, limit
 * Header params: none
 */
export const GetConversationsApiV1MessagesConversationsGetParamsSchema = z.object({
  query: z.object({
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional()
  }).optional()
})

export type GetConversationsApiV1MessagesConversationsGetParams = z.infer<typeof GetConversationsApiV1MessagesConversationsGetParamsSchema>
/**
 * Request schema for POST /api/v1/messages/conversations
 */
export const CreateConversationApiV1MessagesConversationsPostRequestSchema = ConversationCreateSchema
export type CreateConversationApiV1MessagesConversationsPostRequest = z.infer<typeof CreateConversationApiV1MessagesConversationsPostRequestSchema>
/**
 * Success response schema for POST /api/v1/messages/conversations
 * Status: 201
 * Successful Response
 */
export const CreateConversationApiV1MessagesConversationsPostResponseSchema = ConversationResponseSchema

export type CreateConversationApiV1MessagesConversationsPostResponse = z.infer<typeof CreateConversationApiV1MessagesConversationsPostResponseSchema>
/**
 * Error response schema for POST /api/v1/messages/conversations
 * Status: 422
 * Validation Error
 */
export const CreateConversationApiV1MessagesConversationsPostErrorSchema = HTTPValidationErrorSchema

export type CreateConversationApiV1MessagesConversationsPostError = z.infer<typeof CreateConversationApiV1MessagesConversationsPostErrorSchema>
/**
 * Success response schema for GET /api/v1/messages/conversations/{conversation_id}
 * Status: 200
 * Successful Response
 */
export const GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema = ConversationResponseSchema

export type GetConversationApiV1MessagesConversationsConversationIdGetResponse = z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/messages/conversations/{conversation_id}
 * Status: 422
 * Validation Error
 */
export const GetConversationApiV1MessagesConversationsConversationIdGetErrorSchema = HTTPValidationErrorSchema

export type GetConversationApiV1MessagesConversationsConversationIdGetError = z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/messages/conversations/{conversation_id}
 * Path params: conversation_id
 * Query params: skip, limit
 * Header params: none
 */
export const GetConversationApiV1MessagesConversationsConversationIdGetParamsSchema = z.object({
  path: z.object({
    conversation_id: z.string().max(40, "Maximum length is 40")
  }),
  query: z.object({
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional()
  }).optional()
})

export type GetConversationApiV1MessagesConversationsConversationIdGetParams = z.infer<typeof GetConversationApiV1MessagesConversationsConversationIdGetParamsSchema>
/**
 * Success response schema for GET /api/v1/messages/conversations/{conversation_id}/messages
 * Status: 200
 * Successful Response
 */
export const GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema = MessageListResponseSchema

export type GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponse = z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetResponseSchema>
/**
 * Error response schema for GET /api/v1/messages/conversations/{conversation_id}/messages
 * Status: 422
 * Validation Error
 */
export const GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetErrorSchema = HTTPValidationErrorSchema

export type GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetError = z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/messages/conversations/{conversation_id}/messages
 * Path params: conversation_id
 * Query params: skip, limit
 * Header params: none
 */
export const GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetParamsSchema = z.object({
  path: z.object({
    conversation_id: z.string().max(40, "Maximum length is 40")
  }),
  query: z.object({
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional()
  }).optional()
})

export type GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetParams = z.infer<typeof GetConversationMessagesApiV1MessagesConversationsConversationIdMessagesGetParamsSchema>
/**
 * Success response schema for POST /api/v1/messages/conversations/{conversation_id}/read
 * Status: 200
 * Successful Response
 */
export const MarkConversationReadApiV1MessagesConversationsConversationIdReadPostResponseSchema = z.record(z.string(), z.any())

export type MarkConversationReadApiV1MessagesConversationsConversationIdReadPostResponse = z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostResponseSchema>
/**
 * Error response schema for POST /api/v1/messages/conversations/{conversation_id}/read
 * Status: 422
 * Validation Error
 */
export const MarkConversationReadApiV1MessagesConversationsConversationIdReadPostErrorSchema = HTTPValidationErrorSchema

export type MarkConversationReadApiV1MessagesConversationsConversationIdReadPostError = z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/messages/conversations/{conversation_id}/read
 * Path params: conversation_id
 * Query params: none
 * Header params: none
 */
export const MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema = z.object({
  path: z.object({
    conversation_id: z.string().max(40, "Maximum length is 40")
  })
})

export type MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParams = z.infer<typeof MarkConversationReadApiV1MessagesConversationsConversationIdReadPostParamsSchema>
/**
 * Success response schema for POST /api/v1/messages/{message_id}/read
 * Status: 200
 * Successful Response
 */
export const MarkMessageReadApiV1MessagesMessageIdReadPostResponseSchema = MessageResponseSchema

export type MarkMessageReadApiV1MessagesMessageIdReadPostResponse = z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostResponseSchema>
/**
 * Error response schema for POST /api/v1/messages/{message_id}/read
 * Status: 422
 * Validation Error
 */
export const MarkMessageReadApiV1MessagesMessageIdReadPostErrorSchema = HTTPValidationErrorSchema

export type MarkMessageReadApiV1MessagesMessageIdReadPostError = z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/messages/{message_id}/read
 * Path params: message_id
 * Query params: none
 * Header params: none
 */
export const MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema = z.object({
  path: z.object({
    message_id: z.string().max(40, "Maximum length is 40")
  })
})

export type MarkMessageReadApiV1MessagesMessageIdReadPostParams = z.infer<typeof MarkMessageReadApiV1MessagesMessageIdReadPostParamsSchema>
/**
 * Request schema for POST /api/v1/payments/intent
 */
export const CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema = PaymentIntentCreateSchema
export type CreatePaymentIntentApiV1PaymentsIntentPostRequest = z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostRequestSchema>
/**
 * Success response schema for POST /api/v1/payments/intent
 * Status: 201
 * Successful Response
 */
export const CreatePaymentIntentApiV1PaymentsIntentPostResponseSchema = PaymentIntentResponseSchema

export type CreatePaymentIntentApiV1PaymentsIntentPostResponse = z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostResponseSchema>
/**
 * Error response schema for POST /api/v1/payments/intent
 * Status: 422
 * Validation Error
 */
export const CreatePaymentIntentApiV1PaymentsIntentPostErrorSchema = HTTPValidationErrorSchema

export type CreatePaymentIntentApiV1PaymentsIntentPostError = z.infer<typeof CreatePaymentIntentApiV1PaymentsIntentPostErrorSchema>
/**
 * Request schema for POST /api/v1/payments/process
 */
export const ProcessPaymentApiV1PaymentsProcessPostRequestSchema = PaymentProcessSchema
export type ProcessPaymentApiV1PaymentsProcessPostRequest = z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostRequestSchema>
/**
 * Success response schema for POST /api/v1/payments/process
 * Status: 201
 * Successful Response
 */
export const ProcessPaymentApiV1PaymentsProcessPostResponseSchema = PaymentResponseSchema

export type ProcessPaymentApiV1PaymentsProcessPostResponse = z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostResponseSchema>
/**
 * Error response schema for POST /api/v1/payments/process
 * Status: 422
 * Validation Error
 */
export const ProcessPaymentApiV1PaymentsProcessPostErrorSchema = HTTPValidationErrorSchema

export type ProcessPaymentApiV1PaymentsProcessPostError = z.infer<typeof ProcessPaymentApiV1PaymentsProcessPostErrorSchema>
/**
 * Success response schema for POST /api/v1/webhooks/stripe
 * Status: 200
 * Successful Response
 */
export const StripeWebhookApiV1WebhooksStripePostResponseSchema = z.record(z.string(), z.any())

export type StripeWebhookApiV1WebhooksStripePostResponse = z.infer<typeof StripeWebhookApiV1WebhooksStripePostResponseSchema>
/**
 * Error response schema for POST /api/v1/webhooks/stripe
 * Status: 422
 * Validation Error
 */
export const StripeWebhookApiV1WebhooksStripePostErrorSchema = HTTPValidationErrorSchema

export type StripeWebhookApiV1WebhooksStripePostError = z.infer<typeof StripeWebhookApiV1WebhooksStripePostErrorSchema>
/**
 * Parameters schema for POST /api/v1/webhooks/stripe
 * Path params: none
 * Query params: none
 * Header params: stripe_signature
 */
export const StripeWebhookApiV1WebhooksStripePostParamsSchema = z.object({
  headers: z.object({
    stripe_signature: z.string()
  }).optional()
})

export type StripeWebhookApiV1WebhooksStripePostParams = z.infer<typeof StripeWebhookApiV1WebhooksStripePostParamsSchema>
/**
 * Success response schema for GET /api/v1/recommendations/for-me
 * Status: 200
 * Successful Response
 */
export const GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema = z.array(ListingResponseSchema)

export type GetMyRecommendationsApiV1RecommendationsForMeGetResponse = z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetResponseSchema>
/**
 * Error response schema for GET /api/v1/recommendations/for-me
 * Status: 422
 * Validation Error
 */
export const GetMyRecommendationsApiV1RecommendationsForMeGetErrorSchema = HTTPValidationErrorSchema

export type GetMyRecommendationsApiV1RecommendationsForMeGetError = z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/recommendations/for-me
 * Path params: none
 * Query params: limit
 * Header params: none
 */
export const GetMyRecommendationsApiV1RecommendationsForMeGetParamsSchema = z.object({
  query: z.object({
    limit: z.number().int().min(1, "Minimum value is 1").max(50, "Maximum value is 50").optional()
  }).optional()
})

export type GetMyRecommendationsApiV1RecommendationsForMeGetParams = z.infer<typeof GetMyRecommendationsApiV1RecommendationsForMeGetParamsSchema>
/**
 * Success response schema for GET /api/v1/recommendations/similar/{listing_id}
 * Status: 200
 * Successful Response
 */
export const GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema = z.array(ListingResponseSchema)

export type GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponse = z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/recommendations/similar/{listing_id}
 * Status: 422
 * Validation Error
 */
export const GetSimilarListingsApiV1RecommendationsSimilarListingIdGetErrorSchema = HTTPValidationErrorSchema

export type GetSimilarListingsApiV1RecommendationsSimilarListingIdGetError = z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/recommendations/similar/{listing_id}
 * Path params: listing_id
 * Query params: limit
 * Header params: none
 */
export const GetSimilarListingsApiV1RecommendationsSimilarListingIdGetParamsSchema = z.object({
  path: z.object({
    listing_id: z.string().max(40, "Maximum length is 40")
  }),
  query: z.object({
    limit: z.number().int().min(1, "Minimum value is 1").max(20, "Maximum value is 20").optional()
  }).optional()
})

export type GetSimilarListingsApiV1RecommendationsSimilarListingIdGetParams = z.infer<typeof GetSimilarListingsApiV1RecommendationsSimilarListingIdGetParamsSchema>
/**
 * Success response schema for GET /api/v1/recommendations/trending
 * Status: 200
 * Successful Response
 */
export const GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema = z.array(ListingResponseSchema)

export type GetTrendingListingsApiV1RecommendationsTrendingGetResponse = z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetResponseSchema>
/**
 * Error response schema for GET /api/v1/recommendations/trending
 * Status: 422
 * Validation Error
 */
export const GetTrendingListingsApiV1RecommendationsTrendingGetErrorSchema = HTTPValidationErrorSchema

export type GetTrendingListingsApiV1RecommendationsTrendingGetError = z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/recommendations/trending
 * Path params: none
 * Query params: limit, days
 * Header params: none
 */
export const GetTrendingListingsApiV1RecommendationsTrendingGetParamsSchema = z.object({
  query: z.object({
    limit: z.number().int().min(1, "Minimum value is 1").max(50, "Maximum value is 50").optional(),
    days: z.number().int().min(1, "Minimum value is 1").max(365, "Maximum value is 365").optional()
  }).optional()
})

export type GetTrendingListingsApiV1RecommendationsTrendingGetParams = z.infer<typeof GetTrendingListingsApiV1RecommendationsTrendingGetParamsSchema>
/**
 * Success response schema for GET /api/v1/recommendations/ml/for-me
 * Status: 200
 * Successful Response
 */
export const GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema = z.any()

export type GetMlRecommendationsApiV1RecommendationsMlForMeGetResponse = z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetResponseSchema>
/**
 * Error response schema for GET /api/v1/recommendations/ml/for-me
 * Status: 422
 * Validation Error
 */
export const GetMlRecommendationsApiV1RecommendationsMlForMeGetErrorSchema = HTTPValidationErrorSchema

export type GetMlRecommendationsApiV1RecommendationsMlForMeGetError = z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/recommendations/ml/for-me
 * Path params: none
 * Query params: limit, algorithm
 * Header params: none
 */
export const GetMlRecommendationsApiV1RecommendationsMlForMeGetParamsSchema = z.object({
  query: z.object({
    limit: z.number().int().min(1, "Minimum value is 1").max(50, "Maximum value is 50").optional(),
    algorithm: z.string().regex(/^(hybrid|collaborative|content|neural)$/, "Invalid format").optional()
  }).optional()
})

export type GetMlRecommendationsApiV1RecommendationsMlForMeGetParams = z.infer<typeof GetMlRecommendationsApiV1RecommendationsMlForMeGetParamsSchema>
/**
 * Success response schema for GET /api/v1/recommendations/ml/explain/{listing_id}
 * Status: 200
 * Successful Response
 */
export const ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema = z.any()

export type ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponse = z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/recommendations/ml/explain/{listing_id}
 * Status: 422
 * Validation Error
 */
export const ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetErrorSchema = HTTPValidationErrorSchema

export type ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetError = z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/recommendations/ml/explain/{listing_id}
 * Path params: listing_id
 * Query params: none
 * Header params: none
 */
export const ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetParamsSchema = z.object({
  path: z.object({
    listing_id: z.string().max(40, "Maximum length is 40")
  })
})

export type ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetParams = z.infer<typeof ExplainRecommendationApiV1RecommendationsMlExplainListingIdGetParamsSchema>
/**
 * Success response schema for POST /api/v1/recommendations/ml/train
 * Status: 200
 * Successful Response
 */
export const TrainRecommendationModelApiV1RecommendationsMlTrainPostResponseSchema = z.any()

export type TrainRecommendationModelApiV1RecommendationsMlTrainPostResponse = z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostResponseSchema>
/**
 * Error response schema for POST /api/v1/recommendations/ml/train
 * Status: 422
 * Validation Error
 */
export const TrainRecommendationModelApiV1RecommendationsMlTrainPostErrorSchema = HTTPValidationErrorSchema

export type TrainRecommendationModelApiV1RecommendationsMlTrainPostError = z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/recommendations/ml/train
 * Path params: none
 * Query params: algorithm
 * Header params: none
 */
export const TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema = z.object({
  query: z.object({
    algorithm: z.string().regex(/^(hybrid|collaborative|content|neural)$/, "Invalid format").optional()
  }).optional()
})

export type TrainRecommendationModelApiV1RecommendationsMlTrainPostParams = z.infer<typeof TrainRecommendationModelApiV1RecommendationsMlTrainPostParamsSchema>
/**
 * Success response schema for GET /api/v1/analytics/audit-logs
 * Status: 200
 * Successful Response
 */
export const GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema = z.any()

export type GetAuditLogsApiV1AnalyticsAuditLogsGetResponse = z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetResponseSchema>
/**
 * Error response schema for GET /api/v1/analytics/audit-logs
 * Status: 422
 * Validation Error
 */
export const GetAuditLogsApiV1AnalyticsAuditLogsGetErrorSchema = HTTPValidationErrorSchema

export type GetAuditLogsApiV1AnalyticsAuditLogsGetError = z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/analytics/audit-logs
 * Path params: none
 * Query params: actor_id, action, resource_type, resource_id, start_date, end_date, skip, limit
 * Header params: none
 */
export const GetAuditLogsApiV1AnalyticsAuditLogsGetParamsSchema = z.object({
  query: z.object({
    actor_id: z.any().optional(),
    action: z.any().optional(),
    resource_type: z.any().optional(),
    resource_id: z.any().optional(),
    start_date: z.any().optional(),
    end_date: z.any().optional(),
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional()
  }).optional()
})

export type GetAuditLogsApiV1AnalyticsAuditLogsGetParams = z.infer<typeof GetAuditLogsApiV1AnalyticsAuditLogsGetParamsSchema>
/**
 * Success response schema for GET /api/v1/analytics/audit-logs/{log_id}
 * Status: 200
 * Successful Response
 */
export const GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema = z.any()

export type GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponse = z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/analytics/audit-logs/{log_id}
 * Status: 422
 * Validation Error
 */
export const GetAuditLogApiV1AnalyticsAuditLogsLogIdGetErrorSchema = HTTPValidationErrorSchema

export type GetAuditLogApiV1AnalyticsAuditLogsLogIdGetError = z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/analytics/audit-logs/{log_id}
 * Path params: log_id
 * Query params: none
 * Header params: none
 */
export const GetAuditLogApiV1AnalyticsAuditLogsLogIdGetParamsSchema = z.object({
  path: z.object({
    log_id: z.string()
  })
})

export type GetAuditLogApiV1AnalyticsAuditLogsLogIdGetParams = z.infer<typeof GetAuditLogApiV1AnalyticsAuditLogsLogIdGetParamsSchema>
/**
 * Success response schema for GET /api/v1/analytics/audit-logs/stats/summary
 * Status: 200
 * Successful Response
 */
export const GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema = z.any()

export type GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponse = z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetResponseSchema>
/**
 * Error response schema for GET /api/v1/analytics/audit-logs/stats/summary
 * Status: 422
 * Validation Error
 */
export const GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetErrorSchema = HTTPValidationErrorSchema

export type GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetError = z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/analytics/audit-logs/stats/summary
 * Path params: none
 * Query params: days
 * Header params: none
 */
export const GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetParamsSchema = z.object({
  query: z.object({
    days: z.number().int().min(1, "Minimum value is 1").max(90, "Maximum value is 90").optional()
  }).optional()
})

export type GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetParams = z.infer<typeof GetAuditLogsSummaryApiV1AnalyticsAuditLogsStatsSummaryGetParamsSchema>
/**
 * Success response schema for GET /api/v1/promotions/coupons
 * Status: 200
 * Successful Response
 */
export const ListCouponsApiV1PromotionsCouponsGetResponseSchema = z.array(z.record(z.string(), z.any()))

export type ListCouponsApiV1PromotionsCouponsGetResponse = z.infer<typeof ListCouponsApiV1PromotionsCouponsGetResponseSchema>
/**
 * Error response schema for GET /api/v1/promotions/coupons
 * Status: 422
 * Validation Error
 */
export const ListCouponsApiV1PromotionsCouponsGetErrorSchema = HTTPValidationErrorSchema

export type ListCouponsApiV1PromotionsCouponsGetError = z.infer<typeof ListCouponsApiV1PromotionsCouponsGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/promotions/coupons
 * Path params: none
 * Query params: skip, limit, active_only
 * Header params: none
 */
export const ListCouponsApiV1PromotionsCouponsGetParamsSchema = z.object({
  query: z.object({
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional(),
    active_only: z.boolean().optional()
  }).optional()
})

export type ListCouponsApiV1PromotionsCouponsGetParams = z.infer<typeof ListCouponsApiV1PromotionsCouponsGetParamsSchema>
/**
 * Request schema for POST /api/v1/promotions/coupons
 */
export const CreateCouponApiV1PromotionsCouponsPostRequestSchema = BodyCreateCouponApiV1PromotionsCouponsPostSchema
export type CreateCouponApiV1PromotionsCouponsPostRequest = z.infer<typeof CreateCouponApiV1PromotionsCouponsPostRequestSchema>
/**
 * Success response schema for POST /api/v1/promotions/coupons
 * Status: 200
 * Successful Response
 */
export const CreateCouponApiV1PromotionsCouponsPostResponseSchema = z.record(z.string(), z.any())

export type CreateCouponApiV1PromotionsCouponsPostResponse = z.infer<typeof CreateCouponApiV1PromotionsCouponsPostResponseSchema>
/**
 * Error response schema for POST /api/v1/promotions/coupons
 * Status: 422
 * Validation Error
 */
export const CreateCouponApiV1PromotionsCouponsPostErrorSchema = HTTPValidationErrorSchema

export type CreateCouponApiV1PromotionsCouponsPostError = z.infer<typeof CreateCouponApiV1PromotionsCouponsPostErrorSchema>
/**
 * Success response schema for GET /api/v1/promotions/coupons/{coupon_code}/validate
 * Status: 200
 * Successful Response
 */
export const ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema = z.record(z.string(), z.any())

export type ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponse = z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetResponseSchema>
/**
 * Error response schema for GET /api/v1/promotions/coupons/{coupon_code}/validate
 * Status: 422
 * Validation Error
 */
export const ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetErrorSchema = HTTPValidationErrorSchema

export type ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetError = z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/promotions/coupons/{coupon_code}/validate
 * Path params: coupon_code
 * Query params: listing_id, booking_amount, check_in_date, check_out_date, nights, guests
 * Header params: none
 */
export const ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetParamsSchema = z.object({
  path: z.object({
    coupon_code: z.string()
  }),
  query: z.object({
    listing_id: z.string(),
    booking_amount: z.number(),
    check_in_date: z.string(),
    check_out_date: z.string(),
    nights: z.number().int(),
    guests: z.number().int()
  }).optional()
})

export type ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetParams = z.infer<typeof ValidateCouponApiV1PromotionsCouponsCouponCodeValidateGetParamsSchema>
/**
 * Success response schema for GET /api/v1/promotions/applicable
 * Status: 200
 * Successful Response
 */
export const GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema = z.array(z.record(z.string(), z.any()))

export type GetApplicablePromotionsApiV1PromotionsApplicableGetResponse = z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetResponseSchema>
/**
 * Error response schema for GET /api/v1/promotions/applicable
 * Status: 422
 * Validation Error
 */
export const GetApplicablePromotionsApiV1PromotionsApplicableGetErrorSchema = HTTPValidationErrorSchema

export type GetApplicablePromotionsApiV1PromotionsApplicableGetError = z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/promotions/applicable
 * Path params: none
 * Query params: listing_id, check_in_date, nights, guests
 * Header params: none
 */
export const GetApplicablePromotionsApiV1PromotionsApplicableGetParamsSchema = z.object({
  query: z.object({
    listing_id: z.any().optional(),
    check_in_date: z.any().optional(),
    nights: z.any().optional(),
    guests: z.any().optional()
  }).optional()
})

export type GetApplicablePromotionsApiV1PromotionsApplicableGetParams = z.infer<typeof GetApplicablePromotionsApiV1PromotionsApplicableGetParamsSchema>
/**
 * Request schema for POST /api/v1/notifications/push/send
 */
export const SendPushNotificationApiV1NotificationsPushSendPostRequestSchema = BodySendPushNotificationApiV1NotificationsPushSendPostSchema
export type SendPushNotificationApiV1NotificationsPushSendPostRequest = z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostRequestSchema>
/**
 * Success response schema for POST /api/v1/notifications/push/send
 * Status: 200
 * Successful Response
 */
export const SendPushNotificationApiV1NotificationsPushSendPostResponseSchema = z.record(z.string(), z.any())

export type SendPushNotificationApiV1NotificationsPushSendPostResponse = z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostResponseSchema>
/**
 * Error response schema for POST /api/v1/notifications/push/send
 * Status: 422
 * Validation Error
 */
export const SendPushNotificationApiV1NotificationsPushSendPostErrorSchema = HTTPValidationErrorSchema

export type SendPushNotificationApiV1NotificationsPushSendPostError = z.infer<typeof SendPushNotificationApiV1NotificationsPushSendPostErrorSchema>
/**
 * Request schema for POST /api/v1/notifications/push/bulk
 */
export const SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema = BodySendBulkPushNotificationsApiV1NotificationsPushBulkPostSchema
export type SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequest = z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostRequestSchema>
/**
 * Success response schema for POST /api/v1/notifications/push/bulk
 * Status: 200
 * Successful Response
 */
export const SendBulkPushNotificationsApiV1NotificationsPushBulkPostResponseSchema = z.record(z.string(), z.any())

export type SendBulkPushNotificationsApiV1NotificationsPushBulkPostResponse = z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostResponseSchema>
/**
 * Error response schema for POST /api/v1/notifications/push/bulk
 * Status: 422
 * Validation Error
 */
export const SendBulkPushNotificationsApiV1NotificationsPushBulkPostErrorSchema = HTTPValidationErrorSchema

export type SendBulkPushNotificationsApiV1NotificationsPushBulkPostError = z.infer<typeof SendBulkPushNotificationsApiV1NotificationsPushBulkPostErrorSchema>
/**
 * Success response schema for GET /api/v1/loyalty/status
 * Status: 200
 * Successful Response
 */
export const GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema = LoyaltyStatusResponseSchema

export type GetLoyaltyStatusApiV1LoyaltyStatusGetResponse = z.infer<typeof GetLoyaltyStatusApiV1LoyaltyStatusGetResponseSchema>
/**
 * Request schema for POST /api/v1/loyalty/redeem
 */
export const RedeemPointsApiV1LoyaltyRedeemPostRequestSchema = PointsRedemptionRequestSchema
export type RedeemPointsApiV1LoyaltyRedeemPostRequest = z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostRequestSchema>
/**
 * Success response schema for POST /api/v1/loyalty/redeem
 * Status: 200
 * Successful Response
 */
export const RedeemPointsApiV1LoyaltyRedeemPostResponseSchema = PointsRedemptionResponseSchema

export type RedeemPointsApiV1LoyaltyRedeemPostResponse = z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostResponseSchema>
/**
 * Error response schema for POST /api/v1/loyalty/redeem
 * Status: 422
 * Validation Error
 */
export const RedeemPointsApiV1LoyaltyRedeemPostErrorSchema = HTTPValidationErrorSchema

export type RedeemPointsApiV1LoyaltyRedeemPostError = z.infer<typeof RedeemPointsApiV1LoyaltyRedeemPostErrorSchema>
/**
 * Success response schema for GET /api/v1/loyalty/redemption-options
 * Status: 200
 * Successful Response
 */
export const GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema = RedemptionOptionsResponseSchema

export type GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponse = z.infer<typeof GetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGetResponseSchema>
/**
 * Success response schema for GET /api/v1/loyalty/history
 * Status: 200
 * Successful Response
 */
export const GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema = z.any()

export type GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponse = z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetResponseSchema>
/**
 * Error response schema for GET /api/v1/loyalty/history
 * Status: 422
 * Validation Error
 */
export const GetLoyaltyHistoryApiV1LoyaltyHistoryGetErrorSchema = HTTPValidationErrorSchema

export type GetLoyaltyHistoryApiV1LoyaltyHistoryGetError = z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/loyalty/history
 * Path params: none
 * Query params: limit
 * Header params: none
 */
export const GetLoyaltyHistoryApiV1LoyaltyHistoryGetParamsSchema = z.object({
  query: z.object({
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional()
  }).optional()
})

export type GetLoyaltyHistoryApiV1LoyaltyHistoryGetParams = z.infer<typeof GetLoyaltyHistoryApiV1LoyaltyHistoryGetParamsSchema>
/**
 * Success response schema for POST /api/v1/listings/premium/{listing_id}/upgrade
 * Status: 200
 * Successful Response
 */
export const UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostResponseSchema = z.any()

export type UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostResponse = z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostResponseSchema>
/**
 * Error response schema for POST /api/v1/listings/premium/{listing_id}/upgrade
 * Status: 422
 * Validation Error
 */
export const UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostErrorSchema = HTTPValidationErrorSchema

export type UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostError = z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostErrorSchema>
/**
 * Parameters schema for POST /api/v1/listings/premium/{listing_id}/upgrade
 * Path params: listing_id
 * Query params: tier, duration_days
 * Header params: none
 */
export const UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema = z.object({
  path: z.object({
    listing_id: z.string().max(40, "Maximum length is 40")
  }),
  query: z.object({
    tier: z.string(),
    duration_days: z.any().optional()
  }).optional()
})

export type UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParams = z.infer<typeof UpgradeListingToPremiumApiV1ListingsPremiumListingIdUpgradePostParamsSchema>
/**
 * Success response schema for POST /api/v1/listings/premium/{listing_id}/feature
 * Status: 200
 * Successful Response
 */
export const FeatureListingApiV1ListingsPremiumListingIdFeaturePostResponseSchema = z.any()

export type FeatureListingApiV1ListingsPremiumListingIdFeaturePostResponse = z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostResponseSchema>
/**
 * Error response schema for POST /api/v1/listings/premium/{listing_id}/feature
 * Status: 422
 * Validation Error
 */
export const FeatureListingApiV1ListingsPremiumListingIdFeaturePostErrorSchema = HTTPValidationErrorSchema

export type FeatureListingApiV1ListingsPremiumListingIdFeaturePostError = z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostErrorSchema>
/**
 * Parameters schema for POST /api/v1/listings/premium/{listing_id}/feature
 * Path params: listing_id
 * Query params: duration_days
 * Header params: none
 */
export const FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema = z.object({
  path: z.object({
    listing_id: z.string().max(40, "Maximum length is 40")
  }),
  query: z.object({
    duration_days: z.number().int().min(1, "Minimum value is 1").max(365, "Maximum value is 365").optional()
  }).optional()
})

export type FeatureListingApiV1ListingsPremiumListingIdFeaturePostParams = z.infer<typeof FeatureListingApiV1ListingsPremiumListingIdFeaturePostParamsSchema>
/**
 * Success response schema for GET /api/v1/listings/premium/featured
 * Status: 200
 * Successful Response
 */
export const GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema = z.array(ListingResponseSchema)

export type GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponse = z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetResponseSchema>
/**
 * Error response schema for GET /api/v1/listings/premium/featured
 * Status: 422
 * Validation Error
 */
export const GetFeaturedListingsApiV1ListingsPremiumFeaturedGetErrorSchema = HTTPValidationErrorSchema

export type GetFeaturedListingsApiV1ListingsPremiumFeaturedGetError = z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/listings/premium/featured
 * Path params: none
 * Query params: limit, city, country
 * Header params: none
 */
export const GetFeaturedListingsApiV1ListingsPremiumFeaturedGetParamsSchema = z.object({
  query: z.object({
    limit: z.number().int().min(1, "Minimum value is 1").max(50, "Maximum value is 50").optional(),
    city: z.any().optional(),
    country: z.any().optional()
  }).optional()
})

export type GetFeaturedListingsApiV1ListingsPremiumFeaturedGetParams = z.infer<typeof GetFeaturedListingsApiV1ListingsPremiumFeaturedGetParamsSchema>
/**
 * Success response schema for GET /api/v1/listings/premium/premium
 * Status: 200
 * Successful Response
 */
export const GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema = z.array(ListingResponseSchema)

export type GetPremiumListingsApiV1ListingsPremiumPremiumGetResponse = z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetResponseSchema>
/**
 * Error response schema for GET /api/v1/listings/premium/premium
 * Status: 422
 * Validation Error
 */
export const GetPremiumListingsApiV1ListingsPremiumPremiumGetErrorSchema = HTTPValidationErrorSchema

export type GetPremiumListingsApiV1ListingsPremiumPremiumGetError = z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/listings/premium/premium
 * Path params: none
 * Query params: limit, city, country
 * Header params: none
 */
export const GetPremiumListingsApiV1ListingsPremiumPremiumGetParamsSchema = z.object({
  query: z.object({
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional(),
    city: z.any().optional(),
    country: z.any().optional()
  }).optional()
})

export type GetPremiumListingsApiV1ListingsPremiumPremiumGetParams = z.infer<typeof GetPremiumListingsApiV1ListingsPremiumPremiumGetParamsSchema>
/**
 * Success response schema for GET /api/v1/listings/premium/pricing
 * Status: 200
 * Successful Response
 */
export const GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema = z.any()

export type GetPricingOptionsApiV1ListingsPremiumPricingGetResponse = z.infer<typeof GetPricingOptionsApiV1ListingsPremiumPricingGetResponseSchema>
/**
 * Success response schema for GET /api/v1/travel-guides
 * Status: 200
 * Successful Response
 */
export const GetGuidesApiV1TravelGuidesGetResponseSchema = z.array(TravelGuideResponseSchema)

export type GetGuidesApiV1TravelGuidesGetResponse = z.infer<typeof GetGuidesApiV1TravelGuidesGetResponseSchema>
/**
 * Error response schema for GET /api/v1/travel-guides
 * Status: 422
 * Validation Error
 */
export const GetGuidesApiV1TravelGuidesGetErrorSchema = HTTPValidationErrorSchema

export type GetGuidesApiV1TravelGuidesGetError = z.infer<typeof GetGuidesApiV1TravelGuidesGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/travel-guides
 * Path params: none
 * Query params: destination, country, city, tags, category, is_official, status, skip, limit, sort_by
 * Header params: none
 */
export const GetGuidesApiV1TravelGuidesGetParamsSchema = z.object({
  query: z.object({
    destination: z.any().optional(),
    country: z.any().optional(),
    city: z.any().optional(),
    tags: z.any().optional(),
    category: z.any().optional(),
    is_official: z.any().optional(),
    status: z.string().optional(),
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional(),
    sort_by: z.string().optional()
  }).optional()
})

export type GetGuidesApiV1TravelGuidesGetParams = z.infer<typeof GetGuidesApiV1TravelGuidesGetParamsSchema>
/**
 * Request schema for POST /api/v1/travel-guides
 */
export const CreateGuideApiV1TravelGuidesPostRequestSchema = TravelGuideCreateSchema
export type CreateGuideApiV1TravelGuidesPostRequest = z.infer<typeof CreateGuideApiV1TravelGuidesPostRequestSchema>
/**
 * Success response schema for POST /api/v1/travel-guides
 * Status: 201
 * Successful Response
 */
export const CreateGuideApiV1TravelGuidesPostResponseSchema = TravelGuideResponseSchema

export type CreateGuideApiV1TravelGuidesPostResponse = z.infer<typeof CreateGuideApiV1TravelGuidesPostResponseSchema>
/**
 * Error response schema for POST /api/v1/travel-guides
 * Status: 422
 * Validation Error
 */
export const CreateGuideApiV1TravelGuidesPostErrorSchema = HTTPValidationErrorSchema

export type CreateGuideApiV1TravelGuidesPostError = z.infer<typeof CreateGuideApiV1TravelGuidesPostErrorSchema>
/**
 * Success response schema for POST /api/v1/travel-guides/{guide_id}/publish
 * Status: 200
 * Successful Response
 */
export const PublishGuideApiV1TravelGuidesGuideIdPublishPostResponseSchema = TravelGuideResponseSchema

export type PublishGuideApiV1TravelGuidesGuideIdPublishPostResponse = z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostResponseSchema>
/**
 * Error response schema for POST /api/v1/travel-guides/{guide_id}/publish
 * Status: 422
 * Validation Error
 */
export const PublishGuideApiV1TravelGuidesGuideIdPublishPostErrorSchema = HTTPValidationErrorSchema

export type PublishGuideApiV1TravelGuidesGuideIdPublishPostError = z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/travel-guides/{guide_id}/publish
 * Path params: guide_id
 * Query params: none
 * Header params: none
 */
export const PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema = z.object({
  path: z.object({
    guide_id: z.string().max(40, "Maximum length is 40")
  })
})

export type PublishGuideApiV1TravelGuidesGuideIdPublishPostParams = z.infer<typeof PublishGuideApiV1TravelGuidesGuideIdPublishPostParamsSchema>
/**
 * Success response schema for GET /api/v1/travel-guides/{guide_id}
 * Status: 200
 * Successful Response
 */
export const GetGuideApiV1TravelGuidesGuideIdGetResponseSchema = TravelGuideResponseSchema

export type GetGuideApiV1TravelGuidesGuideIdGetResponse = z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/travel-guides/{guide_id}
 * Status: 422
 * Validation Error
 */
export const GetGuideApiV1TravelGuidesGuideIdGetErrorSchema = HTTPValidationErrorSchema

export type GetGuideApiV1TravelGuidesGuideIdGetError = z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/travel-guides/{guide_id}
 * Path params: guide_id
 * Query params: none
 * Header params: none
 */
export const GetGuideApiV1TravelGuidesGuideIdGetParamsSchema = z.object({
  path: z.object({
    guide_id: z.string().max(40, "Maximum length is 40")
  })
})

export type GetGuideApiV1TravelGuidesGuideIdGetParams = z.infer<typeof GetGuideApiV1TravelGuidesGuideIdGetParamsSchema>
/**
 * Success response schema for POST /api/v1/travel-guides/{guide_id}/bookmark
 * Status: 200
 * Successful Response
 */
export const BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostResponseSchema = z.any()

export type BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostResponse = z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostResponseSchema>
/**
 * Error response schema for POST /api/v1/travel-guides/{guide_id}/bookmark
 * Status: 422
 * Validation Error
 */
export const BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostErrorSchema = HTTPValidationErrorSchema

export type BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostError = z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/travel-guides/{guide_id}/bookmark
 * Path params: guide_id
 * Query params: none
 * Header params: none
 */
export const BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema = z.object({
  path: z.object({
    guide_id: z.string().max(40, "Maximum length is 40")
  })
})

export type BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParams = z.infer<typeof BookmarkGuideApiV1TravelGuidesGuideIdBookmarkPostParamsSchema>
/**
 * Success response schema for POST /api/v1/travel-guides/{guide_id}/like
 * Status: 200
 * Successful Response
 */
export const LikeGuideApiV1TravelGuidesGuideIdLikePostResponseSchema = z.any()

export type LikeGuideApiV1TravelGuidesGuideIdLikePostResponse = z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostResponseSchema>
/**
 * Error response schema for POST /api/v1/travel-guides/{guide_id}/like
 * Status: 422
 * Validation Error
 */
export const LikeGuideApiV1TravelGuidesGuideIdLikePostErrorSchema = HTTPValidationErrorSchema

export type LikeGuideApiV1TravelGuidesGuideIdLikePostError = z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostErrorSchema>
/**
 * Parameters schema for POST /api/v1/travel-guides/{guide_id}/like
 * Path params: guide_id
 * Query params: none
 * Header params: none
 */
export const LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema = z.object({
  path: z.object({
    guide_id: z.string().max(40, "Maximum length is 40")
  })
})

export type LikeGuideApiV1TravelGuidesGuideIdLikePostParams = z.infer<typeof LikeGuideApiV1TravelGuidesGuideIdLikePostParamsSchema>
/**
 * Success response schema for GET /api/v1/travel-guides/stories
 * Status: 200
 * Successful Response
 */
export const GetStoriesApiV1TravelGuidesStoriesGetResponseSchema = z.array(UserStoryResponseSchema)

export type GetStoriesApiV1TravelGuidesStoriesGetResponse = z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetResponseSchema>
/**
 * Error response schema for GET /api/v1/travel-guides/stories
 * Status: 422
 * Validation Error
 */
export const GetStoriesApiV1TravelGuidesStoriesGetErrorSchema = HTTPValidationErrorSchema

export type GetStoriesApiV1TravelGuidesStoriesGetError = z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/travel-guides/stories
 * Path params: none
 * Query params: destination, country, author_id, guide_id, is_featured, status, skip, limit, sort_by
 * Header params: none
 */
export const GetStoriesApiV1TravelGuidesStoriesGetParamsSchema = z.object({
  query: z.object({
    destination: z.any().optional(),
    country: z.any().optional(),
    author_id: z.any().optional(),
    guide_id: z.any().optional(),
    is_featured: z.any().optional(),
    status: z.string().optional(),
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional(),
    sort_by: z.string().optional()
  }).optional()
})

export type GetStoriesApiV1TravelGuidesStoriesGetParams = z.infer<typeof GetStoriesApiV1TravelGuidesStoriesGetParamsSchema>
/**
 * Request schema for POST /api/v1/travel-guides/stories
 */
export const CreateStoryApiV1TravelGuidesStoriesPostRequestSchema = UserStoryCreateSchema
export type CreateStoryApiV1TravelGuidesStoriesPostRequest = z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostRequestSchema>
/**
 * Success response schema for POST /api/v1/travel-guides/stories
 * Status: 201
 * Successful Response
 */
export const CreateStoryApiV1TravelGuidesStoriesPostResponseSchema = UserStoryResponseSchema

export type CreateStoryApiV1TravelGuidesStoriesPostResponse = z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostResponseSchema>
/**
 * Error response schema for POST /api/v1/travel-guides/stories
 * Status: 422
 * Validation Error
 */
export const CreateStoryApiV1TravelGuidesStoriesPostErrorSchema = HTTPValidationErrorSchema

export type CreateStoryApiV1TravelGuidesStoriesPostError = z.infer<typeof CreateStoryApiV1TravelGuidesStoriesPostErrorSchema>
/**
 * Success response schema for POST /api/v1/travel-guides/stories/{story_id}/publish
 * Status: 200
 * Successful Response
 */
export const PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostResponseSchema = UserStoryResponseSchema

export type PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostResponse = z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostResponseSchema>
/**
 * Error response schema for POST /api/v1/travel-guides/stories/{story_id}/publish
 * Status: 422
 * Validation Error
 */
export const PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostErrorSchema = HTTPValidationErrorSchema

export type PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostError = z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/travel-guides/stories/{story_id}/publish
 * Path params: story_id
 * Query params: none
 * Header params: none
 */
export const PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema = z.object({
  path: z.object({
    story_id: z.string().max(40, "Maximum length is 40")
  })
})

export type PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParams = z.infer<typeof PublishStoryApiV1TravelGuidesStoriesStoryIdPublishPostParamsSchema>
/**
 * Success response schema for GET /api/v1/travel-guides/stories/{story_id}
 * Status: 200
 * Successful Response
 */
export const GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema = UserStoryResponseSchema

export type GetStoryApiV1TravelGuidesStoriesStoryIdGetResponse = z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/travel-guides/stories/{story_id}
 * Status: 422
 * Validation Error
 */
export const GetStoryApiV1TravelGuidesStoriesStoryIdGetErrorSchema = HTTPValidationErrorSchema

export type GetStoryApiV1TravelGuidesStoriesStoryIdGetError = z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/travel-guides/stories/{story_id}
 * Path params: story_id
 * Query params: none
 * Header params: none
 */
export const GetStoryApiV1TravelGuidesStoriesStoryIdGetParamsSchema = z.object({
  path: z.object({
    story_id: z.string().max(40, "Maximum length is 40")
  })
})

export type GetStoryApiV1TravelGuidesStoriesStoryIdGetParams = z.infer<typeof GetStoryApiV1TravelGuidesStoriesStoryIdGetParamsSchema>
/**
 * Success response schema for GET /api/v1/subscriptions/plans
 * Status: 200
 * Successful Response
 */
export const GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema = z.any()

export type GetSubscriptionPlansApiV1SubscriptionsPlansGetResponse = z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetResponseSchema>
/**
 * Error response schema for GET /api/v1/subscriptions/plans
 * Status: 422
 * Validation Error
 */
export const GetSubscriptionPlansApiV1SubscriptionsPlansGetErrorSchema = HTTPValidationErrorSchema

export type GetSubscriptionPlansApiV1SubscriptionsPlansGetError = z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/subscriptions/plans
 * Path params: none
 * Query params: plan_type
 * Header params: none
 */
export const GetSubscriptionPlansApiV1SubscriptionsPlansGetParamsSchema = z.object({
  query: z.object({
    plan_type: SubscriptionPlanTypeSchema
  }).optional()
})

export type GetSubscriptionPlansApiV1SubscriptionsPlansGetParams = z.infer<typeof GetSubscriptionPlansApiV1SubscriptionsPlansGetParamsSchema>
/**
 * Success response schema for GET /api/v1/subscriptions/my-subscription
 * Status: 200
 * Successful Response
 */
export const GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema = z.any()

export type GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponse = z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetResponseSchema>
/**
 * Error response schema for GET /api/v1/subscriptions/my-subscription
 * Status: 422
 * Validation Error
 */
export const GetMySubscriptionApiV1SubscriptionsMySubscriptionGetErrorSchema = HTTPValidationErrorSchema

export type GetMySubscriptionApiV1SubscriptionsMySubscriptionGetError = z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/subscriptions/my-subscription
 * Path params: none
 * Query params: plan_type
 * Header params: none
 */
export const GetMySubscriptionApiV1SubscriptionsMySubscriptionGetParamsSchema = z.object({
  query: z.object({
    plan_type: z.any().optional()
  }).optional()
})

export type GetMySubscriptionApiV1SubscriptionsMySubscriptionGetParams = z.infer<typeof GetMySubscriptionApiV1SubscriptionsMySubscriptionGetParamsSchema>
/**
 * Success response schema for POST /api/v1/subscriptions/subscribe
 * Status: 200
 * Successful Response
 */
export const SubscribeApiV1SubscriptionsSubscribePostResponseSchema = z.any()

export type SubscribeApiV1SubscriptionsSubscribePostResponse = z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostResponseSchema>
/**
 * Error response schema for POST /api/v1/subscriptions/subscribe
 * Status: 422
 * Validation Error
 */
export const SubscribeApiV1SubscriptionsSubscribePostErrorSchema = HTTPValidationErrorSchema

export type SubscribeApiV1SubscriptionsSubscribePostError = z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostErrorSchema>
/**
 * Parameters schema for POST /api/v1/subscriptions/subscribe
 * Path params: none
 * Query params: plan_id, billing_cycle
 * Header params: none
 */
export const SubscribeApiV1SubscriptionsSubscribePostParamsSchema = z.object({
  query: z.object({
    plan_id: z.string().max(40, "Maximum length is 40"),
    billing_cycle: z.string().regex(/^(monthly|yearly)$/, "Invalid format").optional()
  }).optional()
})

export type SubscribeApiV1SubscriptionsSubscribePostParams = z.infer<typeof SubscribeApiV1SubscriptionsSubscribePostParamsSchema>
/**
 * Success response schema for POST /api/v1/subscriptions/{subscription_id}/cancel
 * Status: 200
 * Successful Response
 */
export const CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostResponseSchema = z.any()

export type CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostResponse = z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostResponseSchema>
/**
 * Error response schema for POST /api/v1/subscriptions/{subscription_id}/cancel
 * Status: 422
 * Validation Error
 */
export const CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostErrorSchema = HTTPValidationErrorSchema

export type CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostError = z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/subscriptions/{subscription_id}/cancel
 * Path params: subscription_id
 * Query params: cancel_immediately
 * Header params: none
 */
export const CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema = z.object({
  path: z.object({
    subscription_id: z.string().max(40, "Maximum length is 40")
  }),
  query: z.object({
    cancel_immediately: z.boolean().optional()
  }).optional()
})

export type CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParams = z.infer<typeof CancelSubscriptionApiV1SubscriptionsSubscriptionIdCancelPostParamsSchema>
/**
 * Success response schema for GET /api/v1/subscriptions/usage/{limit_type}
 * Status: 200
 * Successful Response
 */
export const CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema = z.any()

export type CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponse = z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetResponseSchema>
/**
 * Error response schema for GET /api/v1/subscriptions/usage/{limit_type}
 * Status: 422
 * Validation Error
 */
export const CheckUsageApiV1SubscriptionsUsageLimitTypeGetErrorSchema = HTTPValidationErrorSchema

export type CheckUsageApiV1SubscriptionsUsageLimitTypeGetError = z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/subscriptions/usage/{limit_type}
 * Path params: limit_type
 * Query params: plan_type
 * Header params: none
 */
export const CheckUsageApiV1SubscriptionsUsageLimitTypeGetParamsSchema = z.object({
  path: z.object({
    limit_type: z.string().regex(/^(listings|bookings_per_month|guests)$/, "Invalid format")
  }),
  query: z.object({
    plan_type: z.any().optional()
  }).optional()
})

export type CheckUsageApiV1SubscriptionsUsageLimitTypeGetParams = z.infer<typeof CheckUsageApiV1SubscriptionsUsageLimitTypeGetParamsSchema>
/**
 * Success response schema for GET /api/v1/tenancy/tenant
 * Status: 200
 * Successful Response
 */
export const GetCurrentTenantApiV1TenancyTenantGetResponseSchema = z.any()

export type GetCurrentTenantApiV1TenancyTenantGetResponse = z.infer<typeof GetCurrentTenantApiV1TenancyTenantGetResponseSchema>
/**
 * Success response schema for POST /api/v1/tenancy/tenant
 * Status: 200
 * Successful Response
 */
export const CreateTenantApiV1TenancyTenantPostResponseSchema = z.any()

export type CreateTenantApiV1TenancyTenantPostResponse = z.infer<typeof CreateTenantApiV1TenancyTenantPostResponseSchema>
/**
 * Error response schema for POST /api/v1/tenancy/tenant
 * Status: 422
 * Validation Error
 */
export const CreateTenantApiV1TenancyTenantPostErrorSchema = HTTPValidationErrorSchema

export type CreateTenantApiV1TenancyTenantPostError = z.infer<typeof CreateTenantApiV1TenancyTenantPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/tenancy/tenant
 * Path params: none
 * Query params: name, slug, domain, contact_email
 * Header params: none
 */
export const CreateTenantApiV1TenancyTenantPostParamsSchema = z.object({
  query: z.object({
    name: z.string(),
    slug: z.string(),
    domain: z.any().optional(),
    contact_email: z.any().optional()
  }).optional()
})

export type CreateTenantApiV1TenancyTenantPostParams = z.infer<typeof CreateTenantApiV1TenancyTenantPostParamsSchema>
/**
 * Success response schema for PUT /api/v1/tenancy/tenant/{tenant_id}/branding
 * Status: 200
 * Successful Response
 */
export const UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutResponseSchema = z.any()

export type UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutResponse = z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutResponseSchema>
/**
 * Error response schema for PUT /api/v1/tenancy/tenant/{tenant_id}/branding
 * Status: 422
 * Validation Error
 */
export const UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutErrorSchema = HTTPValidationErrorSchema

export type UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutError = z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutErrorSchema>
/**
 * Parameters schema for PUT /api/v1/tenancy/tenant/{tenant_id}/branding
 * Path params: tenant_id
 * Query params: logo_url, primary_color, secondary_color, custom_css
 * Header params: none
 */
export const UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema = z.object({
  path: z.object({
    tenant_id: z.string().max(40, "Maximum length is 40")
  }),
  query: z.object({
    logo_url: z.any().optional(),
    primary_color: z.any().optional(),
    secondary_color: z.any().optional(),
    custom_css: z.any().optional()
  }).optional()
})

export type UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParams = z.infer<typeof UpdateBrandingApiV1TenancyTenantTenantIdBrandingPutParamsSchema>
/**
 * Success response schema for POST /api/v1/tenancy/tenant/{tenant_id}/domain
 * Status: 200
 * Successful Response
 */
export const AddCustomDomainApiV1TenancyTenantTenantIdDomainPostResponseSchema = z.any()

export type AddCustomDomainApiV1TenancyTenantTenantIdDomainPostResponse = z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostResponseSchema>
/**
 * Error response schema for POST /api/v1/tenancy/tenant/{tenant_id}/domain
 * Status: 422
 * Validation Error
 */
export const AddCustomDomainApiV1TenancyTenantTenantIdDomainPostErrorSchema = HTTPValidationErrorSchema

export type AddCustomDomainApiV1TenancyTenantTenantIdDomainPostError = z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/tenancy/tenant/{tenant_id}/domain
 * Path params: tenant_id
 * Query params: domain
 * Header params: none
 */
export const AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema = z.object({
  path: z.object({
    tenant_id: z.string().max(40, "Maximum length is 40")
  }),
  query: z.object({
    domain: z.string()
  }).optional()
})

export type AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParams = z.infer<typeof AddCustomDomainApiV1TenancyTenantTenantIdDomainPostParamsSchema>
/**
 * Success response schema for POST /api/v1/tenancy/tenant/domain/verify
 * Status: 200
 * Successful Response
 */
export const VerifyDomainApiV1TenancyTenantDomainVerifyPostResponseSchema = z.any()

export type VerifyDomainApiV1TenancyTenantDomainVerifyPostResponse = z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostResponseSchema>
/**
 * Error response schema for POST /api/v1/tenancy/tenant/domain/verify
 * Status: 422
 * Validation Error
 */
export const VerifyDomainApiV1TenancyTenantDomainVerifyPostErrorSchema = HTTPValidationErrorSchema

export type VerifyDomainApiV1TenancyTenantDomainVerifyPostError = z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/tenancy/tenant/domain/verify
 * Path params: none
 * Query params: domain, verification_token
 * Header params: none
 */
export const VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema = z.object({
  query: z.object({
    domain: z.string(),
    verification_token: z.string()
  }).optional()
})

export type VerifyDomainApiV1TenancyTenantDomainVerifyPostParams = z.infer<typeof VerifyDomainApiV1TenancyTenantDomainVerifyPostParamsSchema>
/**
 * Success response schema for GET /api/v1/tenancy/tenant/{tenant_id}/config
 * Status: 200
 * Successful Response
 */
export const GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema = z.any()

export type GetConfigApiV1TenancyTenantTenantIdConfigGetResponse = z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetResponseSchema>
/**
 * Error response schema for GET /api/v1/tenancy/tenant/{tenant_id}/config
 * Status: 422
 * Validation Error
 */
export const GetConfigApiV1TenancyTenantTenantIdConfigGetErrorSchema = HTTPValidationErrorSchema

export type GetConfigApiV1TenancyTenantTenantIdConfigGetError = z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/tenancy/tenant/{tenant_id}/config
 * Path params: tenant_id
 * Query params: none
 * Header params: none
 */
export const GetConfigApiV1TenancyTenantTenantIdConfigGetParamsSchema = z.object({
  path: z.object({
    tenant_id: z.string().max(40, "Maximum length is 40")
  })
})

export type GetConfigApiV1TenancyTenantTenantIdConfigGetParams = z.infer<typeof GetConfigApiV1TenancyTenantTenantIdConfigGetParamsSchema>
/**
 * Request schema for PUT /api/v1/tenancy/tenant/{tenant_id}/config
 */
export const UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema = z.record(z.string(), z.any())
export type UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequest = z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutRequestSchema>
/**
 * Success response schema for PUT /api/v1/tenancy/tenant/{tenant_id}/config
 * Status: 200
 * Successful Response
 */
export const UpdateConfigApiV1TenancyTenantTenantIdConfigPutResponseSchema = z.any()

export type UpdateConfigApiV1TenancyTenantTenantIdConfigPutResponse = z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutResponseSchema>
/**
 * Error response schema for PUT /api/v1/tenancy/tenant/{tenant_id}/config
 * Status: 422
 * Validation Error
 */
export const UpdateConfigApiV1TenancyTenantTenantIdConfigPutErrorSchema = HTTPValidationErrorSchema

export type UpdateConfigApiV1TenancyTenantTenantIdConfigPutError = z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutErrorSchema>
/**
 * Parameters schema for PUT /api/v1/tenancy/tenant/{tenant_id}/config
 * Path params: tenant_id
 * Query params: none
 * Header params: none
 */
export const UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema = z.object({
  path: z.object({
    tenant_id: z.string().max(40, "Maximum length is 40")
  })
})

export type UpdateConfigApiV1TenancyTenantTenantIdConfigPutParams = z.infer<typeof UpdateConfigApiV1TenancyTenantTenantIdConfigPutParamsSchema>
/**
 * Success response schema for GET /api/v1/admin/users
 * Status: 200
 * Successful Response
 */
export const ListUsersApiV1AdminUsersGetResponseSchema = AdminUserListResponseSchema

export type ListUsersApiV1AdminUsersGetResponse = z.infer<typeof ListUsersApiV1AdminUsersGetResponseSchema>
/**
 * Error response schema for GET /api/v1/admin/users
 * Status: 422
 * Validation Error
 */
export const ListUsersApiV1AdminUsersGetErrorSchema = HTTPValidationErrorSchema

export type ListUsersApiV1AdminUsersGetError = z.infer<typeof ListUsersApiV1AdminUsersGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/admin/users
 * Path params: none
 * Query params: skip, limit, role, status, search
 * Header params: none
 */
export const ListUsersApiV1AdminUsersGetParamsSchema = z.object({
  query: z.object({
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional(),
    role: z.any().optional(),
    status: z.any().optional(),
    search: z.any().optional()
  }).optional()
})

export type ListUsersApiV1AdminUsersGetParams = z.infer<typeof ListUsersApiV1AdminUsersGetParamsSchema>
/**
 * Success response schema for GET /api/v1/admin/users/{user_id}
 * Status: 200
 * Successful Response
 */
export const GetUserApiV1AdminUsersUserIdGetResponseSchema = AdminUserResponseSchema

export type GetUserApiV1AdminUsersUserIdGetResponse = z.infer<typeof GetUserApiV1AdminUsersUserIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/admin/users/{user_id}
 * Status: 422
 * Validation Error
 */
export const GetUserApiV1AdminUsersUserIdGetErrorSchema = HTTPValidationErrorSchema

export type GetUserApiV1AdminUsersUserIdGetError = z.infer<typeof GetUserApiV1AdminUsersUserIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/admin/users/{user_id}
 * Path params: user_id
 * Query params: none
 * Header params: none
 */
export const GetUserApiV1AdminUsersUserIdGetParamsSchema = z.object({
  path: z.object({
    user_id: z.string().max(40, "Maximum length is 40")
  })
})

export type GetUserApiV1AdminUsersUserIdGetParams = z.infer<typeof GetUserApiV1AdminUsersUserIdGetParamsSchema>
/**
 * Request schema for PUT /api/v1/admin/users/{user_id}
 */
export const UpdateUserApiV1AdminUsersUserIdPutRequestSchema = AdminUserUpdateSchema
export type UpdateUserApiV1AdminUsersUserIdPutRequest = z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutRequestSchema>
/**
 * Success response schema for PUT /api/v1/admin/users/{user_id}
 * Status: 200
 * Successful Response
 */
export const UpdateUserApiV1AdminUsersUserIdPutResponseSchema = AdminUserResponseSchema

export type UpdateUserApiV1AdminUsersUserIdPutResponse = z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutResponseSchema>
/**
 * Error response schema for PUT /api/v1/admin/users/{user_id}
 * Status: 422
 * Validation Error
 */
export const UpdateUserApiV1AdminUsersUserIdPutErrorSchema = HTTPValidationErrorSchema

export type UpdateUserApiV1AdminUsersUserIdPutError = z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutErrorSchema>
/**
 * Parameters schema for PUT /api/v1/admin/users/{user_id}
 * Path params: user_id
 * Query params: none
 * Header params: none
 */
export const UpdateUserApiV1AdminUsersUserIdPutParamsSchema = z.object({
  path: z.object({
    user_id: z.string().max(40, "Maximum length is 40")
  })
})

export type UpdateUserApiV1AdminUsersUserIdPutParams = z.infer<typeof UpdateUserApiV1AdminUsersUserIdPutParamsSchema>
/**
 * Success response schema for POST /api/v1/admin/users/{user_id}/suspend
 * Status: 200
 * Successful Response
 */
export const SuspendUserApiV1AdminUsersUserIdSuspendPostResponseSchema = AdminUserResponseSchema

export type SuspendUserApiV1AdminUsersUserIdSuspendPostResponse = z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostResponseSchema>
/**
 * Error response schema for POST /api/v1/admin/users/{user_id}/suspend
 * Status: 422
 * Validation Error
 */
export const SuspendUserApiV1AdminUsersUserIdSuspendPostErrorSchema = HTTPValidationErrorSchema

export type SuspendUserApiV1AdminUsersUserIdSuspendPostError = z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostErrorSchema>
/**
 * Parameters schema for POST /api/v1/admin/users/{user_id}/suspend
 * Path params: user_id
 * Query params: none
 * Header params: none
 */
export const SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema = z.object({
  path: z.object({
    user_id: z.string().max(40, "Maximum length is 40")
  })
})

export type SuspendUserApiV1AdminUsersUserIdSuspendPostParams = z.infer<typeof SuspendUserApiV1AdminUsersUserIdSuspendPostParamsSchema>
/**
 * Success response schema for POST /api/v1/admin/users/{user_id}/activate
 * Status: 200
 * Successful Response
 */
export const ActivateUserApiV1AdminUsersUserIdActivatePostResponseSchema = AdminUserResponseSchema

export type ActivateUserApiV1AdminUsersUserIdActivatePostResponse = z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostResponseSchema>
/**
 * Error response schema for POST /api/v1/admin/users/{user_id}/activate
 * Status: 422
 * Validation Error
 */
export const ActivateUserApiV1AdminUsersUserIdActivatePostErrorSchema = HTTPValidationErrorSchema

export type ActivateUserApiV1AdminUsersUserIdActivatePostError = z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostErrorSchema>
/**
 * Parameters schema for POST /api/v1/admin/users/{user_id}/activate
 * Path params: user_id
 * Query params: none
 * Header params: none
 */
export const ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema = z.object({
  path: z.object({
    user_id: z.string().max(40, "Maximum length is 40")
  })
})

export type ActivateUserApiV1AdminUsersUserIdActivatePostParams = z.infer<typeof ActivateUserApiV1AdminUsersUserIdActivatePostParamsSchema>
/**
 * Success response schema for GET /api/v1/admin/users/stats
 * Status: 200
 * Successful Response
 */
export const GetUserStatsApiV1AdminUsersStatsGetResponseSchema = AdminUserStatsResponseSchema

export type GetUserStatsApiV1AdminUsersStatsGetResponse = z.infer<typeof GetUserStatsApiV1AdminUsersStatsGetResponseSchema>
/**
 * Success response schema for GET /api/v1/admin/dashboard/metrics
 * Status: 200
 * Successful Response
 */
export const GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema = DashboardMetricsResponseSchema

export type GetDashboardMetricsApiV1AdminDashboardMetricsGetResponse = z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetResponseSchema>
/**
 * Error response schema for GET /api/v1/admin/dashboard/metrics
 * Status: 422
 * Validation Error
 */
export const GetDashboardMetricsApiV1AdminDashboardMetricsGetErrorSchema = HTTPValidationErrorSchema

export type GetDashboardMetricsApiV1AdminDashboardMetricsGetError = z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/admin/dashboard/metrics
 * Path params: none
 * Query params: start_date, end_date
 * Header params: none
 */
export const GetDashboardMetricsApiV1AdminDashboardMetricsGetParamsSchema = z.object({
  query: z.object({
    start_date: z.any().optional(),
    end_date: z.any().optional()
  }).optional()
})

export type GetDashboardMetricsApiV1AdminDashboardMetricsGetParams = z.infer<typeof GetDashboardMetricsApiV1AdminDashboardMetricsGetParamsSchema>
/**
 * Success response schema for GET /api/v1/admin/dashboard/booking-trends
 * Status: 200
 * Successful Response
 */
export const GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema = BookingTrendsResponseSchema

export type GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponse = z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetResponseSchema>
/**
 * Error response schema for GET /api/v1/admin/dashboard/booking-trends
 * Status: 422
 * Validation Error
 */
export const GetBookingTrendsApiV1AdminDashboardBookingTrendsGetErrorSchema = HTTPValidationErrorSchema

export type GetBookingTrendsApiV1AdminDashboardBookingTrendsGetError = z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/admin/dashboard/booking-trends
 * Path params: none
 * Query params: days
 * Header params: none
 */
export const GetBookingTrendsApiV1AdminDashboardBookingTrendsGetParamsSchema = z.object({
  query: z.object({
    days: z.number().int().min(1, "Minimum value is 1").max(365, "Maximum value is 365").optional()
  }).optional()
})

export type GetBookingTrendsApiV1AdminDashboardBookingTrendsGetParams = z.infer<typeof GetBookingTrendsApiV1AdminDashboardBookingTrendsGetParamsSchema>
/**
 * Success response schema for GET /api/v1/admin/dashboard/popular-destinations
 * Status: 200
 * Successful Response
 */
export const GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema = PopularDestinationsResponseSchema

export type GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponse = z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetResponseSchema>
/**
 * Error response schema for GET /api/v1/admin/dashboard/popular-destinations
 * Status: 422
 * Validation Error
 */
export const GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetErrorSchema = HTTPValidationErrorSchema

export type GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetError = z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/admin/dashboard/popular-destinations
 * Path params: none
 * Query params: limit, days
 * Header params: none
 */
export const GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetParamsSchema = z.object({
  query: z.object({
    limit: z.number().int().min(1, "Minimum value is 1").max(50, "Maximum value is 50").optional(),
    days: z.number().int().min(1, "Minimum value is 1").max(365, "Maximum value is 365").optional()
  }).optional()
})

export type GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetParams = z.infer<typeof GetPopularDestinationsApiV1AdminDashboardPopularDestinationsGetParamsSchema>
/**
 * Success response schema for GET /api/v1/admin/listings
 * Status: 200
 * Successful Response
 */
export const ListListingsApiV1AdminListingsGetResponseSchema = AdminListingListResponseSchema

export type ListListingsApiV1AdminListingsGetResponse = z.infer<typeof ListListingsApiV1AdminListingsGetResponseSchema>
/**
 * Error response schema for GET /api/v1/admin/listings
 * Status: 422
 * Validation Error
 */
export const ListListingsApiV1AdminListingsGetErrorSchema = HTTPValidationErrorSchema

export type ListListingsApiV1AdminListingsGetError = z.infer<typeof ListListingsApiV1AdminListingsGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/admin/listings
 * Path params: none
 * Query params: skip, limit, status, search
 * Header params: none
 */
export const ListListingsApiV1AdminListingsGetParamsSchema = z.object({
  query: z.object({
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional(),
    status: z.any().optional(),
    search: z.any().optional()
  }).optional()
})

export type ListListingsApiV1AdminListingsGetParams = z.infer<typeof ListListingsApiV1AdminListingsGetParamsSchema>
/**
 * Success response schema for GET /api/v1/admin/listings/{listing_id}
 * Status: 200
 * Successful Response
 */
export const GetListingApiV1AdminListingsListingIdGetResponseSchema = AdminListingResponseSchema

export type GetListingApiV1AdminListingsListingIdGetResponse = z.infer<typeof GetListingApiV1AdminListingsListingIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/admin/listings/{listing_id}
 * Status: 422
 * Validation Error
 */
export const GetListingApiV1AdminListingsListingIdGetErrorSchema = HTTPValidationErrorSchema

export type GetListingApiV1AdminListingsListingIdGetError = z.infer<typeof GetListingApiV1AdminListingsListingIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/admin/listings/{listing_id}
 * Path params: listing_id
 * Query params: none
 * Header params: none
 */
export const GetListingApiV1AdminListingsListingIdGetParamsSchema = z.object({
  path: z.object({
    listing_id: z.string().max(40, "Maximum length is 40")
  })
})

export type GetListingApiV1AdminListingsListingIdGetParams = z.infer<typeof GetListingApiV1AdminListingsListingIdGetParamsSchema>
/**
 * Success response schema for GET /api/v1/admin/listings/stats
 * Status: 200
 * Successful Response
 */
export const GetListingStatsApiV1AdminListingsStatsGetResponseSchema = AdminListingStatsResponseSchema

export type GetListingStatsApiV1AdminListingsStatsGetResponse = z.infer<typeof GetListingStatsApiV1AdminListingsStatsGetResponseSchema>
/**
 * Success response schema for GET /api/v1/admin/bookings
 * Status: 200
 * Successful Response
 */
export const ListBookingsApiV1AdminBookingsGetResponseSchema = AdminBookingListResponseSchema

export type ListBookingsApiV1AdminBookingsGetResponse = z.infer<typeof ListBookingsApiV1AdminBookingsGetResponseSchema>
/**
 * Error response schema for GET /api/v1/admin/bookings
 * Status: 422
 * Validation Error
 */
export const ListBookingsApiV1AdminBookingsGetErrorSchema = HTTPValidationErrorSchema

export type ListBookingsApiV1AdminBookingsGetError = z.infer<typeof ListBookingsApiV1AdminBookingsGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/admin/bookings
 * Path params: none
 * Query params: skip, limit, status
 * Header params: none
 */
export const ListBookingsApiV1AdminBookingsGetParamsSchema = z.object({
  query: z.object({
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional(),
    status: z.any().optional()
  }).optional()
})

export type ListBookingsApiV1AdminBookingsGetParams = z.infer<typeof ListBookingsApiV1AdminBookingsGetParamsSchema>
/**
 * Success response schema for GET /api/v1/admin/bookings/{booking_id}
 * Status: 200
 * Successful Response
 */
export const GetBookingApiV1AdminBookingsBookingIdGetResponseSchema = AdminBookingResponseSchema

export type GetBookingApiV1AdminBookingsBookingIdGetResponse = z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/admin/bookings/{booking_id}
 * Status: 422
 * Validation Error
 */
export const GetBookingApiV1AdminBookingsBookingIdGetErrorSchema = HTTPValidationErrorSchema

export type GetBookingApiV1AdminBookingsBookingIdGetError = z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/admin/bookings/{booking_id}
 * Path params: booking_id
 * Query params: none
 * Header params: none
 */
export const GetBookingApiV1AdminBookingsBookingIdGetParamsSchema = z.object({
  path: z.object({
    booking_id: z.string().max(40, "Maximum length is 40")
  })
})

export type GetBookingApiV1AdminBookingsBookingIdGetParams = z.infer<typeof GetBookingApiV1AdminBookingsBookingIdGetParamsSchema>
/**
 * Success response schema for GET /api/v1/admin/bookings/stats
 * Status: 200
 * Successful Response
 */
export const GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema = AdminBookingStatsResponseSchema

export type GetBookingStatsApiV1AdminBookingsStatsGetResponse = z.infer<typeof GetBookingStatsApiV1AdminBookingsStatsGetResponseSchema>
/**
 * Success response schema for GET /api/v1/admin/payments
 * Status: 200
 * Successful Response
 */
export const ListPaymentsApiV1AdminPaymentsGetResponseSchema = AdminPaymentListResponseSchema

export type ListPaymentsApiV1AdminPaymentsGetResponse = z.infer<typeof ListPaymentsApiV1AdminPaymentsGetResponseSchema>
/**
 * Error response schema for GET /api/v1/admin/payments
 * Status: 422
 * Validation Error
 */
export const ListPaymentsApiV1AdminPaymentsGetErrorSchema = HTTPValidationErrorSchema

export type ListPaymentsApiV1AdminPaymentsGetError = z.infer<typeof ListPaymentsApiV1AdminPaymentsGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/admin/payments
 * Path params: none
 * Query params: skip, limit, status
 * Header params: none
 */
export const ListPaymentsApiV1AdminPaymentsGetParamsSchema = z.object({
  query: z.object({
    skip: z.number().int().min(0, "Minimum value is 0").optional(),
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional(),
    status: z.any().optional()
  }).optional()
})

export type ListPaymentsApiV1AdminPaymentsGetParams = z.infer<typeof ListPaymentsApiV1AdminPaymentsGetParamsSchema>
/**
 * Success response schema for GET /api/v1/admin/payments/{payment_id}
 * Status: 200
 * Successful Response
 */
export const GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema = AdminPaymentResponseSchema

export type GetPaymentApiV1AdminPaymentsPaymentIdGetResponse = z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetResponseSchema>
/**
 * Error response schema for GET /api/v1/admin/payments/{payment_id}
 * Status: 422
 * Validation Error
 */
export const GetPaymentApiV1AdminPaymentsPaymentIdGetErrorSchema = HTTPValidationErrorSchema

export type GetPaymentApiV1AdminPaymentsPaymentIdGetError = z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetErrorSchema>
/**
 * Parameters schema for GET /api/v1/admin/payments/{payment_id}
 * Path params: payment_id
 * Query params: none
 * Header params: none
 */
export const GetPaymentApiV1AdminPaymentsPaymentIdGetParamsSchema = z.object({
  path: z.object({
    payment_id: z.string().max(40, "Maximum length is 40")
  })
})

export type GetPaymentApiV1AdminPaymentsPaymentIdGetParams = z.infer<typeof GetPaymentApiV1AdminPaymentsPaymentIdGetParamsSchema>
/**
 * Success response schema for GET /api/v1/admin/payments/stats
 * Status: 200
 * Successful Response
 */
export const GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema = AdminPaymentStatsResponseSchema

export type GetPaymentStatsApiV1AdminPaymentsStatsGetResponse = z.infer<typeof GetPaymentStatsApiV1AdminPaymentsStatsGetResponseSchema>
/**
 * Success response schema for GET /
 * Status: 200
 * Successful Response
 */
export const RootGetResponseSchema = z.any()

export type RootGetResponse = z.infer<typeof RootGetResponseSchema>


// Validation helper functions
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: string[]
} {
  try {
    const result = schema.safeParse(data)
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      return {
        success: false,
        errors: result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error']
    }
  }
}

export function createValidator<T>(schema: z.ZodSchema<T>) {
  return (data: unknown) => validateSchema(schema, data)
}

// Common validation patterns
export const commonPatterns = {
  email: /^[^s@]+@[^s@]+.[^s@]+$/,
  // phone: /^+?[ds-$$$$]+$/,
  // url: /^https?://.+/,
  // uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
}

// Custom error messages
export const errorMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  url: 'Please enter a valid URL',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  min: (min: number) => `Must be at least ${min}`,
  max: (max: number) => `Must be no more than ${max}`
}
