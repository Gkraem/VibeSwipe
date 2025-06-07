import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function SpotifyCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Parse the hash fragment for the access token
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const error = params.get('error');
    const state = params.get('state');
    
    // Verify state to prevent CSRF attacks
    const expectedState = localStorage.getItem('spotify_auth_state');
    
    if (window.opener) {
      // This is a popup window (desktop)
      if (error) {
        window.opener.postMessage({
          type: 'SPOTIFY_AUTH_ERROR',
          error: error
        }, window.location.origin);
      } else if (accessToken && state === expectedState) {
        window.opener.postMessage({
          type: 'SPOTIFY_AUTH_SUCCESS',
          access_token: accessToken,
          token_type: params.get('token_type'),
          expires_in: params.get('expires_in')
        }, window.location.origin);
      } else {
        window.opener.postMessage({
          type: 'SPOTIFY_AUTH_ERROR',
          error: 'Invalid authentication response'
        }, window.location.origin);
      }
      
      // Clean up and close popup
      localStorage.removeItem('spotify_auth_state');
      window.close();
    } else {
      // This is a mobile redirect (same window)
      if (error) {
        console.error('Spotify auth error:', error);
        // Navigate back to home with error
        setLocation('/?spotify_error=' + encodeURIComponent(error));
      } else if (accessToken && state === expectedState) {
        // Store token temporarily and navigate back
        sessionStorage.setItem('spotify_temp_token', accessToken);
        
        // Get return page or default to home
        const returnPage = sessionStorage.getItem('spotify_return_page') || '/';
        sessionStorage.removeItem('spotify_return_page');
        
        // Navigate back with success flag
        setLocation(returnPage + '?spotify_success=true');
      } else {
        // Navigate back with error
        setLocation('/?spotify_error=invalid_response');
      }
      
      // Clean up
      localStorage.removeItem('spotify_auth_state');
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-white">Completing Spotify authentication...</p>
      </div>
    </div>
  );
}