/* eslint-disable @typescript-eslint/no-explicit-any */
// Base Types
export interface BaseModel {
  id: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}


export interface PointGeometry {
  type: 'Point';
  coordinates: [number, number];
}

export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export interface MultiPolygonGeometry {
  type: 'MultiPolygon';
  coordinates: [number, number][][][];
}

export interface Country extends BaseModel {
  name: string;
  iso_code?: string;
  iso3_code?: string;
  phone_code?: string;
  capital?: string;
  currency?: string;
  languages: string[];
  geometry?: MultiPolygonGeometry;
  centroid?: PointGeometry;
  bounding_box?: PolygonGeometry;
}

export interface Region extends BaseModel {
  country: Country | string;
  name: string;
  code?: string;
  admin_level: number;
  geometry?: MultiPolygonGeometry;
  centroid?: PointGeometry;
  bounding_box?: PolygonGeometry;
}

export interface City extends BaseModel {
  country: Country | string;
  region?: Region | string | null;
  name: string;
  name_ascii: string;
  timezone?: string;
  population?: number;
  elevation?: number;
  feature_code?: string;
  geometry: PointGeometry;
  bounding_box?: PolygonGeometry;
}

// Authentication Types
export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterUser {
  email: string;
  password: string;
  re_password: string;
  first_name?: string;
  last_name?: string;
}

export interface SocialAuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export enum UserRole {
  GUEST = 'guest',
  OWNER = 'owner',
  ORGANIZATION = 'organization',
  DEVELOPER = 'developer',
  ADMIN = 'admin'
}

export enum MembershipLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
  OTHER = 'other'
}

export interface UserProfile extends BaseModel {
  user: string;
  avatar?: string;
  bio?: string;
  phone_number?: string;
  location?: PointGeometry;
  country?: Country;
  region?: Region;
  city?: City;
  postal_code?: string;
  address?: string;
  date_of_birth?: string;
  gender: Gender;
  travel_history: any[];
  travel_interests: any[];
  language_proficiency: Record<string, unknown>;
  preferred_countries: Country[];
  search_history: any[];
  privacy_consent: boolean;
  consent_date?: string;
  notification_push_token?: string;
  wants_push_notifications: boolean;
  wants_sms_notifications: boolean;
}

export interface User extends BaseModel {
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  language: string;
  timezone: string;
  preferred_language: string;
  preferred_currency: string;
  is_online: boolean;
  is_active: boolean;
  is_staff: boolean;
  is_2fa_enabled: boolean;
  role: UserRole;
  is_profile_public: boolean;
  following: string[];
  points: number;
  membership_level: MembershipLevel;
  profile?: UserProfile;
  last_login_device?: string;
  last_login_ip?: string;
  last_activity?: string;
  followers_count: number;
  following_count: number;
  is_following?: boolean;
}

// Content Types
export interface ContentType extends BaseModel {
  app_label: string;
  model: string;
}
export enum InteractionType {
  VIEW_PLACE = 'view_place',
  VIEW_EXPERIENCE = 'view_experience',
  VIEW_FLIGHT = 'view_flight',
  WISHLIST_ADD = 'wishlist_add',
  WISHLIST_REMOVE = 'wishlist_remove',
  SHARE = 'share',
  PHOTO_VIEW = 'photo_view',
  MAP_VIEW = 'map_view',
  SEARCH = 'search',
  FILTER = 'filter',
  DETAILS_EXPAND = 'details_expand',
  AVAILABILITY_CHECK = 'availability_check',
  BOOKING_START = 'booking_start',
  BOOKING_ABANDON = 'booking_abandon',
  BOOKING_COMPLETE = 'booking_complete',
  RATING_GIVEN = 'rating_given',
  REVIEW_ADDED = 'review_added',
  RECOMMENDATION_SHOW = 'recommendation_show',
  RECOMMENDATION_CLICK = 'recommendation_click'
}


export interface UserInteraction extends BaseModel {
  user: User | string;
  content_type: string | ContentType;
  object_id: string;
  content_object: {
    id: string;
    [key: string]: any;
  };
  interaction_type: InteractionType;
  metadata: Record<string, any>;
  device_type?: 'mobile' | 'desktop' | 'tablet';
}

// Category Types
export interface Category extends BaseModel {
  name: string;
  description?: string;
}

// Discount Types
export interface Discount extends BaseModel {
  code: string;
  discount_type: 'Percentage' | 'Fixed';
  amount: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  applicable_places?: string[];
  applicable_experiences?: string[];
  applicable_flights?: string[];
  applicable_boxes?: string[];
}


export interface Media extends BaseModel {
  url: string;
  file:string;
  type: 'image' | 'video';
  uploaded_by: User;
}

// Place Types
export interface Place extends BaseModel {
  category: Category;
  owner: User;
  name: string;
  description?: string;
  location: string;
  country?: Country;
  city?: City;
  region?: Region;
  rating: number;
  media?: Media[];
  is_available: boolean;
  price: number;
  currency: string;
  metadata?: Record<string, unknown>;
  experiences?: Experience[];
  is_in_wishlist?: boolean
}

// Experience Types
export interface Experience extends BaseModel {
  category?:Category;
  place?: Place;
  owner?: User;
  title: string;
  description?: string;
  country?: Country;
  region?: Region;
  city?: City;
  location: string;
  price_per_person: number;
  currency: string;
  duration: number;
  capacity: number;
  schedule: Record<string, unknown>[];
  media?: Media;
  rating: number;
  is_available: boolean;
  is_in_wishlist?: boolean | false
}

// Flight Types
export interface Flight extends BaseModel {
  airline: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  airline_url?: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  currency: string;
  duration: number;
  baggage_policy: Record<string, unknown>;
  is_in_wishlist?: boolean | false
}

// Box Itinerary Types
export interface BoxItineraryDay extends BaseModel {
  box: Box | string;
  day_number: number;
  date?: string | null;
  description?: string;
  estimated_hours: number;
  items: BoxItineraryItem;
}

export interface BoxItineraryItem extends BaseModel {
  itinerary_day: BoxItineraryDay | string;
  place?: Place[] | string | null;
  experience?: Experience[] | string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  order: number;
  notes?: string;
  is_optional: boolean;
  estimated_cost?: number | null;
}

// Box Types
export interface Box extends BaseModel {
  category?: Category | string;
  name: string;
  description?: string;
  total_price?: number | null;
  currency: string;
  country?: Country | null;
  city?: City | null;
  media: Media[];
  duration_days: number;
  duration_hours: number;
  metadata?: Record<string, unknown>;
  start_date?: string | null;
  end_date?: string | null;
  is_customizable: boolean;
  max_group_size: number;
  tags: any[];
  itinerary_days?: BoxItineraryDay;
  is_in_wishlist?: boolean | false
}

// Booking Types
export interface Booking extends BaseModel {
  user: User;
  place?: Place;
  experience?: Experience;
  flight?: Flight;
  box?: Box;
  check_in?: string; 
  check_out?: string;
  booking_date: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  total_price: number;
  currency: string;
  payment_status: string;
}

// Wishlist Types
export interface Wishlist extends BaseModel {
  user: User;
  place?: Place;
  experience?: Experience;
  flight?: Flight;
  box?: Box;
}

// Review Types
export interface Review extends BaseModel {
  user: User;
  place?: Place;
  experience?: Experience;
  flight?: Flight;
  rating: 1 | 2 | 3 | 4 | 5;
  review_text: string;
}

// Payment Types
export interface Payment extends BaseModel {
  user: User;
  booking: Booking;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
}

// Message Types
export interface Message extends BaseModel {
  sender: User;
  receiver: User;
  booking?: Booking;
  message_text: string;
  is_read: boolean;
}

// Notification Types
export interface Notification extends BaseModel {
  user: User;
  type: 'Booking Update' | 'Payment' | 'Discount' | 'Message' | 'General';
  message: string;
  is_read: boolean;
}

// Pagination Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}