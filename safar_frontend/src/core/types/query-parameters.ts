export interface BaseQueryParams {
    page?: number
    page_size?: number
    search?: string
    ordering?: string
  }
  
  // Category specific params
export type CategoryQueryParams = BaseQueryParams

// Discount specific params
export interface DiscountQueryParams extends BaseQueryParams {
  discount_type?: string
  is_active?: boolean
}

// Place specific params
export interface PlaceQueryParams extends BaseQueryParams {
  category?: string
  country?: string
  city?: string
  is_available?: boolean
  min_price?: number
  max_price?: number
  rating?: number
}

// Experience specific params
export interface ExperienceQueryParams extends BaseQueryParams {
  category?: string
  place?: string
  is_available?: boolean
  min_price_per_person?: number
  max_price_per_person?: number
  duration?: number
}

// Flight specific params
export interface FlightQueryParams extends BaseQueryParams {
  airline?: string
  departure_airport?: string
  arrival_airport?: string
  departure_time?: string
  arrival_time?: string
  min_price?: number
  max_price?: number
}

// Box specific params
export interface BoxQueryParams extends BaseQueryParams {
  category?: string
  country?: string
  city?: string
  min_total_price?: number
  max_total_price?: number
}

// Booking specific params
export interface BookingQueryParams extends BaseQueryParams {
  status?: string
  payment_status?: string
  check_in_after?: string
  check_in_before?: string
  check_out_after?: string
  check_out_before?: string
}

// Review specific params
export interface ReviewQueryParams extends BaseQueryParams {
  rating?: number
  min_rating?: number
  max_rating?: number
  place?: string
  experience?: string
  flight?: string
}

// Payment specific params
export  interface PaymentQueryParams extends BaseQueryParams {
  payment_status?: string
  min_amount?: number
  max_amount?: number
}

// Update the existing Country query params interface
export interface CountryQueryParams extends BaseQueryParams {
  iso_code?: string
  search?: string
  ordering?: string
}

// Update the existing Region query params interface
export interface RegionQueryParams extends BaseQueryParams {
  country_id?: string
  search?: string
  ordering?: string
}

// Update the existing City query params interface
export interface CityQueryParams extends BaseQueryParams {
  country_id?: string
  region_id?: string
  search?: string
  ordering?: string
}

// Add a new interface for nearby cities query
export interface NearbyCityQueryParams extends BaseQueryParams {
  lat: number
  lng: number
  radius?: number
  search?: string
  ordering?: string
}

// Add a new interface for city search query
// Add a new interface for city search query
export interface CitySearchQueryParams extends BaseQueryParams {
    q: string
    country?: string
    limit?: number
  }