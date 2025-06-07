import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { generateChatResponse, generateSongSuggestions, generatePlaylistFromLikedSongs } from "./openai";
import { insertMessageSchema, insertConversationSchema, insertPlaylistSchema, insertSwipeHistorySchema, type Song } from "@shared/schema";
import { spotifyService } from "./spotifyApi";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    spotifyAccessToken?: string;
    spotifyUserId?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Generate additional songs
  app.post('/api/songs/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, excludeIds = [] } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const { generateSongSuggestions } = await import('./openai');
      const songs = await generateSongSuggestions(prompt, excludeIds);

      res.json({ songs });
    } catch (error) {
      console.error("Error generating additional songs:", error);
      res.status(500).json({ message: "Failed to generate songs" });
    }
  });

  // Chat routes
  app.post('/api/chat/send', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { message, conversationId } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      let currentConversationId = conversationId;

      // Create new conversation if none exists
      if (!currentConversationId) {
        const conversation = await storage.createConversation({
          userId,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        });
        currentConversationId = conversation.id;
      }

      // Save user message
      await storage.createMessage({
        conversationId: currentConversationId,
        role: "user",
        content: message,
      });

      // Generate AI response
      const aiResponse = await generateChatResponse(message);

      // Save AI message
      await storage.createMessage({
        conversationId: currentConversationId,
        role: "assistant",
        content: aiResponse.message,
      });

      console.log(`AI Response: ${aiResponse.message}`);
      console.log(`Suggestions count: ${aiResponse.suggestions ? aiResponse.suggestions.length : 0}`);
      
      res.json({
        conversationId: currentConversationId,
        message: aiResponse.message,
        suggestions: aiResponse.suggestions,
      });
    } catch (error) {
      console.error("Error in chat:", error);
      if (error instanceof Error && error.message.includes("OpenAI API quota exceeded")) {
        res.status(402).json({ 
          message: "OpenAI API quota exceeded. Please provide a valid API key with available credits to generate song recommendations.",
          requiresApiKey: true
        });
      } else {
        res.status(500).json({ message: "Failed to process chat message" });
      }
    }
  });

  app.get('/api/chat/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/chat/conversation/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversationId = parseInt(req.params.id);
      
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const messages = await storage.getConversationMessages(conversationId);
      res.json({ conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Song suggestion routes
  app.post('/api/songs/suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, excludeIds = [] } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const suggestions = await generateSongSuggestions(prompt, excludeIds);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating suggestions:", error);
      if (error instanceof Error && error.message.includes("OpenAI API quota exceeded")) {
        res.status(402).json({ 
          message: "OpenAI API quota exceeded. Please provide a valid API key with available credits to generate song recommendations.",
          requiresApiKey: true
        });
      } else {
        res.status(500).json({ message: "Failed to generate song suggestions" });
      }
    }
  });

  app.post('/api/songs/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, excludeIds = [] } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const songs = await generateSongSuggestions(prompt, excludeIds);
      res.json({ songs });
    } catch (error) {
      console.error("Error generating additional songs:", error);
      if (error instanceof Error && error.message.includes("OpenAI API quota exceeded")) {
        res.status(402).json({ 
          message: "OpenAI API quota exceeded. Please provide a valid API key with available credits to generate song recommendations.",
          requiresApiKey: true
        });
      } else {
        res.status(500).json({ message: "Failed to generate songs" });
      }
    }
  });

  // Swipe tracking routes
  app.post('/api/swipe', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertSwipeHistorySchema.parse({
        ...req.body,
        userId,
      });

      const swipeEntry = await storage.createSwipeHistory(validatedData);
      res.json(swipeEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid swipe data", errors: error.errors });
      }
      console.error("Error saving swipe:", error);
      res.status(500).json({ message: "Failed to save swipe action" });
    }
  });

  app.get('/api/swipe/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const history = await storage.getUserSwipeHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching swipe history:", error);
      res.status(500).json({ message: "Failed to fetch swipe history" });
    }
  });

  // Playlist routes
  app.post('/api/playlists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { songs, originalPrompt } = req.body;

      if (!songs || !Array.isArray(songs) || songs.length === 0) {
        return res.status(400).json({ message: "Songs array is required" });
      }

      // Generate playlist metadata
      const { title, description } = await generatePlaylistFromLikedSongs(songs, originalPrompt || "");

      // Calculate total duration
      const totalDuration = songs.reduce((sum, song) => sum + (song.duration || 0), 0);

      const validatedData = insertPlaylistSchema.parse({
        userId,
        title,
        description,
        songs,
        totalDuration,
      });

      const playlist = await storage.createPlaylist(validatedData);
      res.json(playlist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid playlist data", errors: error.errors });
      }
      console.error("Error creating playlist:", error);
      res.status(500).json({ message: "Failed to create playlist" });
    }
  });

  app.get('/api/playlists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const playlists = await storage.getUserPlaylists(userId);
      res.json(playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ message: "Failed to fetch playlists" });
    }
  });

  app.get('/api/playlists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const playlistId = parseInt(req.params.id);
      
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist || playlist.userId !== userId) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      res.json(playlist);
    } catch (error) {
      console.error("Error fetching playlist:", error);
      res.status(500).json({ message: "Failed to fetch playlist" });
    }
  });

  app.patch('/api/playlists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const playlistId = parseInt(req.params.id);
      const { title } = req.body;
      
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ message: "Title is required" });
      }

      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist || playlist.userId !== userId) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      const updatedPlaylist = await storage.updatePlaylist(playlistId, { title });
      res.json(updatedPlaylist);
    } catch (error) {
      console.error("Error updating playlist:", error);
      res.status(500).json({ message: "Failed to update playlist" });
    }
  });

  // Admin endpoint - get all users (restricted to admin)
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user.email;
      
      // Check if user is admin
      if (userEmail !== 'gkraem@vt.edu') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin endpoint - delete user (restricted to admin)
  app.delete('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user.email;
      const targetUserId = req.params.id;
      
      // Check if user is admin
      if (userEmail !== 'gkraem@vt.edu') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Prevent admin from deleting their own account
      if (req.user.id === targetUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      // Check if target user exists
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deleting other admin accounts
      if (targetUser.email === 'gkraem@vt.edu') {
        return res.status(400).json({ message: "Cannot delete admin accounts" });
      }
      
      await storage.deleteUser(targetUserId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get Spotify connection status
  app.get('/api/spotify/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.spotifyAccessToken && user?.spotifyConnected) {
        res.json({
          connected: true,
          displayName: user.spotifyUserId || 'Your Spotify Account',
          connectedAt: user.spotifyConnected
        });
      } else {
        res.json({ connected: false });
      }
    } catch (error) {
      console.error("Error checking Spotify status:", error);
      res.json({ connected: false });
    }
  });

  // Unlink Spotify account
  app.delete('/api/spotify/unlink', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      await storage.updateUser(userId, {
        spotifyAccessToken: null,
        spotifyRefreshToken: null,
        spotifyUserId: null,
        spotifyConnected: null
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error unlinking Spotify:", error);
      res.status(500).json({ message: "Failed to unlink Spotify account" });
    }
  });

  // Check Spotify auth status for polling
  app.get('/api/spotify/auth-status', isAuthenticated, (req: any, res) => {
    try {
      const accessToken = (req.session as any).spotifyAccessToken;
      res.json({ authenticated: !!accessToken });
    } catch (error) {
      res.json({ authenticated: false });
    }
  });

  // Initiate Spotify OAuth for playlist export
  app.get('/api/spotify/auth', isAuthenticated, (req: any, res) => {
    // Use the exact redirect URI that's registered in Spotify app
    const redirectUri = 'https://b57b8bfb-ba97-46c9-8cd5-5172ac4f1ff1-00-39gr6ib0bs69n.spock.replit.dev/api/auth/spotify/callback';
    
    console.log('=== SPOTIFY AUTH DEBUG ===');
    console.log('Using registered redirect URI:', redirectUri);
    console.log('Client ID:', process.env.SPOTIFY_CLIENT_ID ? 'Present' : 'Missing');
    console.log('Client ID value:', process.env.SPOTIFY_CLIENT_ID ? process.env.SPOTIFY_CLIENT_ID.substring(0, 8) + '...' : 'MISSING');
    console.log('User ID:', req.user.id);
    console.log('User Agent:', req.get('User-Agent'));
    console.log('==========================');
    
    // Check if mobile browser
    const userAgent = req.get('User-Agent') || '';
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Validate required parameters before creating URL
    if (!process.env.SPOTIFY_CLIENT_ID) {
      console.error('SPOTIFY_CLIENT_ID is missing from environment variables');
      return res.status(500).json({ 
        message: "Spotify client ID is not configured",
        error: "missing_client_id"
      });
    }

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${process.env.SPOTIFY_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=playlist-modify-public playlist-modify-private&` +
      `state=${req.user.id}${isMobile ? '_mobile' : ''}`;
    
    console.log('Generated auth URL:', spotifyAuthUrl);
    console.log('Is mobile device:', isMobile);
    
    res.json({ authUrl: spotifyAuthUrl });
  });

  // Handle Spotify OAuth callback for playlist export
  app.get('/api/auth/spotify/callback', async (req, res) => {
    try {
      const { code, state: userId, error } = req.query;
      
      console.log('=== SPOTIFY CALLBACK DEBUG ===');
      console.log('Code:', code ? 'Present' : 'Missing');
      console.log('State (userId):', userId);
      console.log('Error:', error);
      console.log('Full query:', req.query);
      console.log('==============================');
      
      if (error) {
        console.log('Spotify OAuth error:', error);
        return res.redirect(`/?error=spotify_oauth_error&details=${error}`);
      }
      
      if (!code) {
        return res.redirect('/?error=spotify_auth_failed');
      }

      // Exchange code for access token - use registered URI
      const redirectUri = 'https://b57b8bfb-ba97-46c9-8cd5-5172ac4f1ff1-00-39gr6ib0bs69n.spock.replit.dev/api/auth/spotify/callback';
      
      console.log('=== TOKEN EXCHANGE DEBUG ===');
      console.log('Using hardcoded redirect URI for token exchange:', redirectUri);
      console.log('============================');
      
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenResponse.json();
      
      console.log('=== TOKEN RESPONSE DEBUG ===');
      console.log('Token response status:', tokenResponse.status);
      console.log('Token response ok:', tokenResponse.ok);
      console.log('Token data:', tokenData);
      console.log('===========================');
      
      if (!tokenResponse.ok || !tokenData.access_token) {
        console.log('Token exchange failed:', tokenData);
        return res.redirect(`/?error=spotify_token_failed&details=${JSON.stringify(tokenData)}`);
      }

      // Get Spotify user info
      const userInfoResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      
      let spotifyUserData = null;
      if (userInfoResponse.ok) {
        spotifyUserData = await userInfoResponse.json();
      }
      
      // Store tokens permanently in user profile
      const cleanUserId = String(userId).replace('_mobile', '');
      await storage.updateUser(cleanUserId, {
        spotifyAccessToken: tokenData.access_token,
        spotifyRefreshToken: tokenData.refresh_token,
        spotifyUserId: spotifyUserData?.display_name || spotifyUserData?.id || 'Unknown',
        spotifyConnected: new Date()
      });
      
      console.log('=== SPOTIFY TOKENS STORED ===');
      console.log('User ID:', cleanUserId);
      console.log('Spotify User:', spotifyUserData?.display_name || 'Unknown');
      console.log('============================');
      
      // Check if this is a mobile device based on state parameter
      const isMobile = String(userId).includes('_mobile');
      
      // Create a success page that closes the window (mobile-friendly)
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Spotify Connected</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta charset="utf-8">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                text-align: center; 
                padding: 60px 20px; 
                background: linear-gradient(135deg, #1db954, #1ed760);
                color: white;
                margin: 0;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
              }
              .success { font-size: 32px; margin-bottom: 20px; font-weight: bold; }
              .message { font-size: 20px; opacity: 0.9; margin-bottom: 30px; line-height: 1.4; }
              .instruction { font-size: 16px; opacity: 0.8; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="success">✓ Success!</div>
            <div class="message">Your Spotify account is now connected.<br>You can close this page and return to the app.</div>
            <div class="instruction">The playlist export will complete automatically.</div>
            <script>
              // Try to close the window/tab
              setTimeout(function() {
                try {
                  window.close();
                } catch(e) {
                  console.log('Cannot close window automatically');
                }
              }, 1000);
              
              // Also try to go back in history
              setTimeout(function() {
                try {
                  if (window.history.length > 1) {
                    window.history.back();
                  }
                } catch(e) {
                  console.log('Cannot navigate back');
                }
              }, 2000);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Spotify callback error:', error);
      res.redirect('/?error=spotify_callback_failed');
    }
  });

  // Spotify export route
  app.post('/api/playlists/:id/export-spotify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const playlistId = parseInt(req.params.id);
      
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist || playlist.userId !== userId) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      // Get user's stored Spotify tokens
      const user = await storage.getUser(userId);
      if (!user?.spotifyAccessToken) {
        return res.status(401).json({ 
          message: "Please link your Spotify account in Settings first",
          requiresAuth: true
        });
      }

      let accessToken = user.spotifyAccessToken;

      // Get current Spotify user
      const spotifyUser = await spotifyService.getCurrentUser(accessToken);

      // Export playlist to Spotify
      const result = await spotifyService.exportPlaylistToSpotify(
        accessToken,
        spotifyUser.id,
        playlist.title,
        typeof playlist.songs === 'string' ? JSON.parse(playlist.songs) : playlist.songs as Song[],
        playlist.description || undefined
      );

      // Update playlist with Spotify URL
      await storage.updatePlaylist(playlistId, { spotifyUrl: result.playlistUrl });

      res.json({
        success: true,
        playlistUrl: result.playlistUrl,
        message: `Successfully exported ${result.successCount} of ${result.totalCount} songs to Spotify!`,
        successCount: result.successCount,
        totalCount: result.totalCount,
      });
    } catch (error) {
      console.error("Error exporting to Spotify:", error);
      if (error instanceof Error && error.message.includes('access_token')) {
        res.status(401).json({ 
          message: "Spotify access token expired. Please connect to Spotify again.",
          requiresAuth: true
        });
      } else {
        res.status(500).json({ 
          message: "Failed to export playlist to Spotify. Please try again.",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
