// Base Types
export interface BaseModel {
  id: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

// Authentication Types
export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface SocialAuthResponse {
  access: string;
  refresh: string;
  user : User;
}

export interface UserProfile extends BaseModel {
  phone_number?: string;
  gender: 'male' | 'female' | 'prefer_not_to_say';
  avatar?: string;
  bio?: string;
  expo_push_token?: string;
  country?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  address?: string;
  date_of_birth?: string;
}

export interface User extends BaseModel {
  email: string;
  role?: 'guest' | 'owner' | 'organization' | 'developer';
  first_name?: string;
  last_name?: string;
  username?: string;
  is_online?: boolean;
  is_active: boolean;
  profile?: UserProfile;
}


export interface RegisterUser extends User {
  password: string;
  re_password: string;
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


export interface Images extends BaseModel {
  url: string;
  file:string;
  uploaded_by?: string;
}

// Place Types
export interface Place extends BaseModel {
  category: Category;
  owner: User;
  name: string;
  description?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  country?: string;
  city?: string;
  region?: string;
  rating: number;
  images?: Images[];
  is_available: boolean;
  price: number;
  currency: string;
  metadata?: Record<string, unknown>;
  experiences?: Experience[];
}

// Experience Types
export interface Experience extends BaseModel {
  place?: Place;
  owner: User;
  title: string;
  description?: string;
  category?:Category;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  price_per_person: number;
  currency: string;
  duration: number;
  capacity: number;
  schedule: Record<string, unknown>[];
  images: Images[];
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
  name: string;
  description?: string;
  total_price?: number;
  currency: string;
  country?: string;
  city?: string;
  place?: Place[];
  experience?: Experience[];
  contents: Record<string, unknown>[];
  images: Images[];
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