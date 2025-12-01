import { z } from "zod"

// Generated schemas from OpenAPI specification
// Base schemas, request schemas, and response schemas

/**
 * Account providers.
 */
export const AccountProviderSchema = z.enum(["password", "google", "apple", "facebook", "github"])
export type AccountProvider = z.infer<typeof AccountProviderSchema>
/**
 * Booking type.
 */
export const BookingTypeSchema = z.enum(["instant", "request"])
export type BookingType = z.infer<typeof BookingTypeSchema>
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
export const PaymentMethodTypeSchema = z.enum(["credit_card", "debit_card", "paypal", "stripe", "bank_transfer", "crypto"])
export type PaymentMethodType = z.infer<typeof PaymentMethodTypeSchema>
/**
 * Payment statuses.
 */
export const PaymentStatusSchema = z.enum(["initiated", "authorized", "captured", "pending", "processing", "completed", "failed", "refunded", "partially_refunded"])
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>
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
 * Schema for creating a conversation.
 */
export const ConversationCreateSchema = z.object({
  participant_id: z.string().max(40, "Maximum length is 40"),
  listing_id: z.any().optional(),
  booking_id: z.any().optional()
})
export type ConversationCreate = z.infer<typeof ConversationCreateSchema>
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
  id: z.number().int(),
  filename: z.string(),
  original_filename: z.string(),
  file_url: z.string(),
  file_type: FileTypeSchema,
  file_category: FileCategorySchema,
  mime_type: z.string(),
  file_size: z.number().int(),
  uploaded_by: z.number().int(),
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
 * Schema for refresh-token requests.
 */
export const RefreshTokenRequestSchema = z.object({
  refresh_token: z.string()
})
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>
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
  host_profile_id: z.number().int(),
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
export const LoginApiV1UsersLoginPostResponseSchema = TokenResponseSchema

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
export const OauthLoginApiV1UsersOauthLoginPostResponseSchema = TokenResponseSchema

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
 * Success response schema for POST /api/v1/users/email/resend-verification
 * Status: 200
 * Successful Response
 */
export const ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema = z.any()

export type ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponse = z.infer<typeof ResendEmailVerificationApiV1UsersEmailResendVerificationPostResponseSchema>
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
    plan_id: z.number().int()
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
    listing_id: z.number().int()
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
    review_id: z.number().int()
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
    review_id: z.number().int()
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
    review_id: z.number().int()
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
 * Query params: query, city, country, listing_type, min_price, max_price, min_guests, min_bedrooms, min_bathrooms, latitude, longitude, radius_km, skip, limit
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
    limit: z.number().int().min(1, "Minimum value is 1").max(100, "Maximum value is 100").optional()
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
    conversation_id: z.number().int()
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
    conversation_id: z.number().int()
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
    conversation_id: z.number().int()
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
    message_id: z.number().int()
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
