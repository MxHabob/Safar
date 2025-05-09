export interface BaseQueryParams {
    page?: number
    page_size?: number
    search?: string
    ordering?: string
  }
  
export type CategoryQueryParams = BaseQueryParams

export interface DiscountQueryParams extends BaseQueryParams {
  discount_type?: string
  is_active?: boolean
}

export interface PlaceQueryParams extends BaseQueryParams {
  category?: string
  country?: string
  city?: string
  is_available?: boolean
  min_price?: number
  max_price?: number
  rating?: number
}

export interface ExperienceQueryParams extends BaseQueryParams {
  category?: string
  place?: string
  is_available?: boolean
  min_price_per_person?: number
  max_price_per_person?: number
  duration?: number
}

export interface FlightQueryParams extends BaseQueryParams {
  airline?: string
  departure_airport?: string
  arrival_airport?: string
  departure_time?: string
  arrival_time?: string
  min_price?: number
  max_price?: number
}


export interface BoxQueryParams extends BaseQueryParams {
  category?: string
  country?: string
  city?: string
  min_total_price?: number
  max_total_price?: number
}

export interface BookingQueryParams extends BaseQueryParams {
  status?: string
  payment_status?: string
  check_in_after?: string
  check_in_before?: string
  check_out_after?: string
  check_out_before?: string
}

export interface ReviewQueryParams extends BaseQueryParams {
  rating?: number
  min_rating?: number
  max_rating?: number
  place?: string
  experience?: string
  flight?: string
}

export  interface PaymentQueryParams extends BaseQueryParams {
  payment_status?: string
  min_amount?: number
  max_amount?: number
}


export interface CountryQueryParams extends BaseQueryParams {
  iso_code?: string
}

export interface RegionQueryParams extends BaseQueryParams {
  country_id?: string

}

export interface CityQueryParams extends BaseQueryParams {
  country_id?: string
  region_id?: string
}

export interface NearbyCityQueryParams extends BaseQueryParams {
  lat: number
  lng: number
  radius?: number
}

export interface CitySearchQueryParams extends BaseQueryParams {
    q: string
    country?: string
    limit?: number
  }