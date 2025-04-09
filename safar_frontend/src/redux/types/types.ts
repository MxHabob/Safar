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
  country: Country | string; // Can be full object or just ID
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

export interface UserProfile extends BaseModel {
  user: string; // User ID
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
  gender: 'male' | 'female' | 'prefer_not_to_say';
  travel_history: any[];
  travel_interests: any[];
  language_proficiency: Record<string, unknown>;
  preferred_countries: Country[];
  last_active?: string;
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
  role: 'guest' | 'owner' | 'organization' | 'developer';
  is_profile_public: boolean;
  following: string[]; // Array of user IDs
  points: number;
  membership_level: 'bronze' | 'silver' | 'gold';
  profile?: UserProfile;
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
  uploaded_by?: string;
}

// Place Types
export interface Place extends BaseModel {
  category: Category;
  owner: User;
  name: string;
  description?: string;
  location: string;
  country?: string;
  city?: string;
  region?: string;
  rating: number;
  media?: Media[];
  is_available: boolean;
  price: number;
  currency: string;
  metadata?: Record<string, unknown>;
  experiences?: Experience[];
}

// Experience Types
export interface Experience extends BaseModel {
  category?:Category;
  place?: Place;
  owner: User;
  title: string;
  description?: string;
  location: string;
  price_per_person: number;
  currency: string;
  duration: number;
  capacity: number;
  schedule: Record<string, unknown>[];
  media: Media[];
  rating: number;
  is_available: boolean;
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
}

// Box Types
export interface Box extends BaseModel {
  category?:Category;
  name: string;
  description?: string;
  total_price?: number;
  currency: string;
  country?: string;
  city?: string;
  places?: Place[];
  experiences?: Experience[];
  contents: Record<string, unknown>[];
  media: Media[];
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