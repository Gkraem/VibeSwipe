import { useEffect } from 'react';

export default function SpotifyCallback() {
  useEffect(() => {
    // Parse the hash fragment for the access token
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const error = params.get('error');
    const state = params.get('state');
    
    // Verify state to prevent CSRF attacks
    const expectedState = localStorage.getItem('spotify_auth_state');
    
    if (error) {
      // Send error to parent window
      window.opener?.postMessage({
        type: 'SPOTIFY_AUTH_ERROR',
        error: error
      }, window.location.origin);
    } else if (accessToken && state === expectedState) {
      // Send success to parent window
      window.opener?.postMessage({
        type: 'SPOTIFY_AUTH_SUCCESS',
        access_token: accessToken,
        token_type: params.get('token_type'),
        expires_in: params.get('expires_in')
      }, window.location.origin);
    } else {
      // Send error for invalid state or missing token
      window.opener?.postMessage({
        type: 'SPOTIFY_AUTH_ERROR',
        error: 'Invalid authentication response'
      }, window.location.origin);
    }
    
    // Clean up
    localStorage.removeItem('spotify_auth_state');
    
    // Close the popup
    window.close();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-white">Completing Spotify authentication...</p>
      </div>
    </div>
  );
}