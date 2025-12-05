/**
 * Google OAuth Integration using Google Identity Services
 * 
 * This module handles Google Sign-In using the new Google Identity Services SDK.
 * The backend expects an ID token which is verified server-side.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
          hasGrantedAllScopes: (tokenResponse: any, ...scopes: string[]) => boolean;
        };
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            error_callback?: (error: any) => void;
          }) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

/**
 * Load Google Identity Services script
 */
export function loadGoogleScript(clientId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.accounts?.id) {
          reject(new Error('Google script failed to load'));
        }
      }, 5000);
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Wait a bit for Google to initialize
      setTimeout(() => {
        if (window.google?.accounts?.id) {
          resolve();
        } else {
          reject(new Error('Google Identity Services failed to initialize'));
        }
      }, 100);
    };
    script.onerror = () => {
      reject(new Error('Failed to load Google Identity Services script'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Initialize Google Sign-In and get ID token
 * 
 * @param clientId - Google OAuth client ID
 * @returns Promise that resolves with the ID token
 */
export async function signInWithGoogle(clientId: string): Promise<string> {
  // Load Google script if not already loaded
  await loadGoogleScript(clientId);

  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services not available');
  }

  return new Promise((resolve, reject) => {
    let resolved = false;

    // Initialize Google Identity Services
    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential: string }) => {
        if (resolved) return;
        resolved = true;
        
        if (response.credential) {
          resolve(response.credential);
        } else {
          reject(new Error('No credential received from Google'));
        }
      },
    });

    // Try One Tap first (automatic prompt)
    // Note: prompt() doesn't take a callback in the new API
    // The callback is set in initialize()
    try {
      window.google!.accounts.id.prompt();
      // If prompt doesn't show immediately, it's okay - user can use the button
    } catch (error) {
      // One Tap not available, user needs to click button
      // Don't reject here, let the button handle it
    }
  });
}


/**
 * Render Google Sign-In button
 */
export async function renderGoogleButton(
  element: HTMLElement,
  clientId: string,
  onSuccess: (idToken: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    await loadGoogleScript(clientId);

    if (!window.google?.accounts?.id) {
      onError(new Error('Google Identity Services not available'));
      return;
    }

    // Initialize Google Identity Services
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential: string }) => {
        if (response.credential) {
          onSuccess(response.credential);
        } else {
          onError(new Error('No credential received from Google'));
        }
      },
      // Add error handling
      error_callback: (error: any) => {
        console.error('Google Sign-In error:', error);
        if (error.type === 'popup_closed_by_user') {
          onError(new Error('Sign-in was cancelled'));
        } else if (error.type === 'popup_blocked') {
          onError(new Error('Popup was blocked. Please allow popups for this site.'));
        } else {
          onError(new Error(error.message || 'Google Sign-In failed'));
        }
      },
    });

    // Render the button
    try {
      window.google.accounts.id.renderButton(element, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: element.offsetWidth || 382,
        shape: 'rectangular',
      });
    } catch (renderError: any) {
      console.error('Failed to render Google button:', renderError);
      onError(new Error(`Failed to render Google button: ${renderError.message || 'Unknown error'}`));
    }
  } catch (error: any) {
    console.error('Google OAuth initialization error:', error);
    onError(new Error(error.message || 'Failed to initialize Google Sign-In'));
  }
}

