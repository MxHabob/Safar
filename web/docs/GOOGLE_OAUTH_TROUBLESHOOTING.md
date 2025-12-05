# Google OAuth Troubleshooting Guide

## Common Error: "The given origin is not allowed for the given client ID"

### Problem
You see this error in the browser console:
```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

### Solution

1. **Check Your Current URL**
   - Open your browser's developer console
   - Check the exact URL you're accessing (e.g., `http://localhost:3000` or `https://safar.mulverse.com`)
   - Note the protocol (http vs https) and port number

2. **Add Origin to Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to: **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Scroll to **"Authorized JavaScript origins"**
   - Click **"+ ADD URI"**
   - Add your exact URL:
     - For development: `http://localhost:3000` (or your port)
     - For production: `https://safar.mulverse.com`
   - **Important:**
     - Include the protocol (`http://` or `https://`)
     - Do NOT include trailing slashes
     - Include port number if not standard (80 for http, 443 for https)
     - Must match exactly what's in your browser

3. **Save and Wait**
   - Click **"Save"**
   - Wait 2-5 minutes for changes to propagate
   - Refresh your application

4. **Verify**
   - Check that the URL in your browser matches exactly what you added
   - Clear browser cache if needed
   - Try in incognito/private mode

### Common Mistakes

❌ **Wrong:**
- `localhost:3000` (missing protocol)
- `http://localhost:3000/` (trailing slash)
- `https://localhost:3000` (wrong protocol for localhost)
- `http://127.0.0.1:3000` (different from localhost)

✅ **Correct:**
- `http://localhost:3000` (for development)
- `https://safar.mulverse.com` (for production)

## Error: "Cross-Origin-Opener-Policy policy would block the window.postMessage call"

### Problem
This error occurs when security headers block Google's popup communication.

### Solution

The `next.config.ts` has been configured with:
```typescript
{
  key: "Cross-Origin-Opener-Policy",
  value: "same-origin-allow-popups",
}
```

This allows Google OAuth popups to work while maintaining security.

If you still see this error:
1. Clear browser cache
2. Restart your Next.js dev server
3. Check that `next.config.ts` has the correct headers

## Error: "Google Identity Services not available"

### Problem
The Google script failed to load or initialize.

### Solution

1. **Check Network Tab**
   - Open browser DevTools → Network tab
   - Look for `accounts.google.com/gsi/client`
   - Check if it loaded successfully (status 200)

2. **Check Console for Errors**
   - Look for any JavaScript errors
   - Check for CORS or network errors

3. **Verify Client ID**
   - Make sure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set
   - Check that it matches your Google Cloud Console client ID
   - Restart dev server after setting environment variable

4. **Check Internet Connection**
   - Google script loads from `https://accounts.google.com`
   - Make sure you can access this URL

## Error: "No credential received from Google"

### Problem
User signed in but no token was returned.

### Solution

1. **Check Google Cloud Console Settings**
   - Make sure OAuth consent screen is configured
   - Verify that required scopes are enabled
   - Check that your app is in "Testing" or "Published" mode

2. **Check Browser Console**
   - Look for any errors from Google
   - Check if popup was blocked

3. **Try Different Browser**
   - Some browsers block popups more aggressively
   - Try Chrome or Firefox

## General Troubleshooting Steps

1. **Verify Environment Variables**
   ```bash
   # Frontend
   echo $NEXT_PUBLIC_GOOGLE_CLIENT_ID
   
   # Backend
   echo $GOOGLE_CLIENT_ID
   ```

2. **Check Google Cloud Console**
   - OAuth consent screen is configured
   - Client ID is correct
   - Authorized origins are set correctly
   - App is not in "Restricted" mode (unless you added test users)

3. **Clear Browser Data**
   - Clear cookies for your domain
   - Clear cache
   - Try incognito/private mode

4. **Check Network Requests**
   - Open DevTools → Network tab
   - Look for requests to `accounts.google.com`
   - Check status codes and error messages

5. **Verify Backend Configuration**
   - Backend has `GOOGLE_CLIENT_ID` set
   - Backend can reach Google's API
   - Check backend logs for errors

## Testing Checklist

- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in frontend
- [ ] `GOOGLE_CLIENT_ID` is set in backend
- [ ] Client IDs match in both frontend and backend
- [ ] Authorized JavaScript origins include your exact URL
- [ ] OAuth consent screen is configured
- [ ] No browser extensions blocking Google scripts
- [ ] Network allows access to `accounts.google.com`
- [ ] Browser console shows no errors
- [ ] Google button appears on the page
- [ ] Clicking button opens Google sign-in

## Still Having Issues?

1. **Check Google Cloud Console Logs**
   - Go to APIs & Services → OAuth consent screen
   - Check for any warnings or errors

2. **Verify OAuth Consent Screen**
   - App name is set
   - Support email is set
   - Scopes are configured
   - Test users are added (if in Testing mode)

3. **Check Backend Logs**
   - Look for errors when verifying tokens
   - Check network connectivity to Google

4. **Contact Support**
   - Include browser console errors
   - Include network tab screenshots
   - Include your Google Cloud Console configuration (without sensitive data)

