/**
 * k6 Load Testing Script for Safar Backend
 * 
 * Target: 50,000 concurrent users on booking APIs
 * 
 * Usage:
 *   k6 run --vus 50000 --duration 5m k6-load-test.js
 * 
 * For gradual ramp-up:
 *   k6 run --stage 30s:1000 --stage 1m:10000 --stage 2m:50000 --stage 1m:50000 k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const bookingSuccessRate = new Rate('booking_success');
const bookingDuration = new Trend('booking_duration');
const searchDuration = new Trend('search_duration');
const paymentDuration = new Trend('payment_duration');
const errorRate = new Rate('errors');
const bookingCounter = new Counter('bookings_created');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 1000 },   // Ramp up to 1k users
    { duration: '1m', target: 10000 },  // Ramp up to 10k users
    { duration: '2m', target: 50000 },  // Ramp up to 50k users
    { duration: '5m', target: 50000 },  // Stay at 50k for 5 minutes
    { duration: '1m', target: 0 },      // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p95<250', 'p99<500'],  // 95% < 250ms, 99% < 500ms
    'http_req_failed': ['rate<0.01'],              // < 1% errors
    'booking_success': ['rate>0.95'],              // > 95% booking success
    'errors': ['rate<0.01'],                        // < 1% errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

// Test user credentials (should be pre-created)
const TEST_USERS = [
  { email: 'loadtest1@example.com', password: 'testpass123' },
  { email: 'loadtest2@example.com', password: 'testpass123' },
  { email: 'loadtest3@example.com', password: 'testpass123' },
];

let authTokens = {};
let listingIds = [];

export function setup() {
  // Setup: Create test users and listings (run once before test)
  console.log('Setting up test data...');
  
  // This would typically call setup endpoints or use pre-created test data
  // For now, we'll use existing test data
  
  return {
    baseUrl: BASE_URL,
    apiPrefix: API_PREFIX,
  };
}

export default function (data) {
  const userIndex = __VU % TEST_USERS.length;
  const user = TEST_USERS[userIndex];
  
  // Authenticate (cache token per VU)
  if (!authTokens[user.email]) {
    const loginRes = http.post(`${data.baseUrl}${data.apiPrefix}/users/login`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (loginRes.status === 200) {
      authTokens[user.email] = JSON.parse(loginRes.body).access_token;
    } else {
      errorRate.add(1);
      return;
    }
  }
  
  const token = authTokens[user.email];
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Test 1: Search listings (read-heavy)
  const searchStart = Date.now();
  const searchRes = http.get(`${data.baseUrl}${data.apiPrefix}/search/listings?query=beach&limit=20`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const searchTime = Date.now() - searchStart;
  
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search returns listings': (r) => {
      const body = JSON.parse(r.body);
      return body.items && body.items.length > 0;
    },
  }) || errorRate.add(1);
  
  searchDuration.add(searchTime);
  
  // Extract listing ID if available
  if (searchRes.status === 200) {
    const searchBody = JSON.parse(searchRes.body);
    if (searchBody.items && searchBody.items.length > 0) {
      listingIds.push(searchBody.items[0].id);
    }
  }
  
  sleep(0.5); // Simulate user thinking time
  
  // Test 2: Get listing details
  if (listingIds.length > 0) {
    const listingId = listingIds[listingIds.length - 1];
    const listingRes = http.get(`${data.baseUrl}${data.apiPrefix}/listings/${listingId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    check(listingRes, {
      'listing details status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  }
  
  sleep(0.3);
  
  // Test 3: Check availability (read-heavy)
  if (listingIds.length > 0) {
    const listingId = listingIds[listingIds.length - 1];
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 7);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 3);
    
    const availabilityRes = http.get(
      `${data.baseUrl}${data.apiPrefix}/bookings/availability?listing_id=${listingId}&check_in=${checkIn.toISOString()}&check_out=${checkOut.toISOString()}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    check(availabilityRes, {
      'availability check status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  }
  
  sleep(0.2);
  
  // Test 4: Calculate price
  if (listingIds.length > 0 && Math.random() > 0.7) { // Only 30% of users proceed to booking
    const listingId = listingIds[listingIds.length - 1];
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 7);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 3);
    
    const priceRes = http.post(
      `${data.baseUrl}${data.apiPrefix}/bookings/calculate-price`,
      JSON.stringify({
        listing_id: listingId,
        check_in: checkIn.toISOString(),
        check_out: checkOut.toISOString(),
        guests: 2,
      }),
      { headers }
    );
    
    check(priceRes, {
      'price calculation status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    sleep(0.5);
    
    // Test 5: Create booking (write-heavy, critical path)
    if (priceRes.status === 200) {
      const bookingStart = Date.now();
      const bookingRes = http.post(
        `${data.baseUrl}${data.apiPrefix}/bookings`,
        JSON.stringify({
          listing_id: listingId,
          check_in: checkIn.toISOString(),
          check_out: checkOut.toISOString(),
          guests: 2,
        }),
        { headers }
      );
      const bookingTime = Date.now() - bookingStart;
      
      const bookingSuccess = check(bookingRes, {
        'booking creation status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'booking has booking_number': (r) => {
          if (r.status === 200 || r.status === 201) {
            const body = JSON.parse(r.body);
            return body.booking_number !== undefined;
          }
          return false;
        },
      });
      
      if (bookingSuccess) {
        bookingSuccessRate.add(1);
        bookingCounter.add(1);
      } else {
        bookingSuccessRate.add(0);
        errorRate.add(1);
      }
      
      bookingDuration.add(bookingTime);
    }
  }
  
  sleep(1); // Simulate user reading/thinking time
}

export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total bookings created: ${bookingCounter}`);
}

