# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication in the Safar application.

## Backend Configuration

The backend is already configured to verify Google ID tokens. You need to:

1. **Get Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins and redirect URIs

2. **Set Environment Variables:**
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

## Frontend Configuration

1. **Set Environment Variable:**
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```

2. **Authorized JavaScript Origins (IMPORTANT!):**
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Click on your OAuth 2.0 Client ID
   - Under "Authorized JavaScript origins", add:
     - `http://localhost:3000` (for development)
     - `http://localhost:3001` (if using different port)
     - `https://safar.mulverse.com` (for production)
     - `https://www.safar.mulverse.com` (if using www)
   - **Make sure to include the protocol (http:// or https://)**
   - **Do NOT include trailing slashes**

3. **Authorized Redirect URIs:**
   - Under "Authorized redirect URIs", add:
     - `http://localhost:3000` (for development)
     - `https://safar.mulverse.com` (for production)
   - **Note:** For Google Identity Services, you typically don't need redirect URIs, but add them just in case

4. **Important Notes:**
   - The origin must **exactly match** the URL in your browser
   - If you see "The given origin is not allowed", check:
     - The URL in your browser matches exactly (including http vs https)
     - No trailing slashes
     - Port number matches (if using non-standard port)
   - Changes in Google Cloud Console may take a few minutes to propagate

## How It Works

1. **User clicks "Continue with Google" button**
2. **Google Identity Services SDK loads** (automatically)
3. **User signs in with Google** (One Tap or button)
4. **Google returns ID token** to the frontend
5. **Frontend sends ID token** to backend `/api/v1/users/oauth/login`
6. **Backend verifies token** with Google's tokeninfo endpoint
7. **Backend creates/updates user** and returns JWT tokens
8. **Frontend stores tokens** and redirects user

## Implementation Details

### Backend (`backend/app/infrastructure/oauth/service.py`)
- Uses Google's `tokeninfo` endpoint to verify ID tokens
- Validates token signature, expiration, and audience
- Extracts user information (email, name, picture, etc.)

### Frontend (`web/src/lib/auth/google-oauth.ts`)
- Loads Google Identity Services SDK dynamically
- Initializes Google Sign-In with client ID
- Handles One Tap and button-based sign-in
- Sends ID token to backend for verification

### Component (`web/src/components/auth/oauth-buttons.tsx`)
- Renders Google Sign-In button
- Handles OAuth flow and error states
- Integrates with backend OAuth endpoint

## Testing

1. Make sure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set
2. Make sure backend has `GOOGLE_CLIENT_ID` configured
3. Click "Continue with Google" button
4. Sign in with Google account
5. Verify you're redirected and logged in

## Troubleshooting

### "Google OAuth is not configured"
- Check that `GOOGLE_CLIENT_ID` is set in backend environment
- Restart backend server after setting environment variable

### "Google Sign-In is not configured"
- Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in frontend environment
- Restart frontend dev server after setting environment variable

### "Invalid token audience"
- Make sure frontend and backend use the same `GOOGLE_CLIENT_ID`
- Check that the client ID matches in Google Cloud Console

### Google button doesn't appear
- Check browser console for errors
- Verify Google script is loading: `https://accounts.google.com/gsi/client`
- Check that client ID is valid and authorized origins are set correctly

## Security Notes

- ID tokens are verified server-side (never trust client-side tokens)
- Token audience is validated to ensure it's for your application
- Token expiration is checked
- User information is extracted securely from verified tokens

