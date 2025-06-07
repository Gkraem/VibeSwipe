import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./spotifyAuth";
import { generateChatResponse, generateSongSuggestions, generatePlaylistFromLikedSongs } from "./openai";
import { insertMessageSchema, insertConversationSchema, insertPlaylistSchema, insertSwipeHistorySchema, type Song } from "@shared/schema";
import { spotifyService } from "./spotifyApi";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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
      res.status(500).json({ message: "Failed to process chat message" });
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
      res.status(500).json({ message: "Failed to generate song suggestions" });
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
      res.status(500).json({ message: "Failed to generate songs" });
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

  // Spotify export route
  app.post('/api/playlists/:id/export-spotify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const playlistId = parseInt(req.params.id);
      
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist || playlist.userId !== userId) {
        return res.status(404).json({ message: "Playlist not found" });
      }

      // Get user's Spotify access token from session
      const accessToken = req.user.accessToken;
      if (!accessToken) {
        return res.status(401).json({ message: "Spotify access token not found. Please log in again." });
      }

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
      res.status(500).json({ 
        message: "Failed to export playlist to Spotify. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
