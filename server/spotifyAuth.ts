import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

import { Strategy as SpotifyStrategy } from 'passport-spotify';

if (!process.env.SPOTIFY_CLIENT_ID) {
  throw new Error("Environment variable SPOTIFY_CLIENT_ID not provided");
}

if (!process.env.SPOTIFY_CLIENT_SECRET) {
  throw new Error("Environment variable SPOTIFY_CLIENT_SECRET not provided");
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Spotify Strategy
  passport.use(
    new SpotifyStrategy(
      {
        clientID: process.env.SPOTIFY_CLIENT_ID!,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
        callbackURL: process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/api/auth/spotify/callback`
          : "/api/auth/spotify/callback",
      },
      async (accessToken: string, refreshToken: string, expires_in: number, profile: any, done: any) => {
        try {
          // Create or update user in database
          const user = await storage.upsertUser({
            id: profile.id,
            email: profile.emails?.[0]?.value || null,
            firstName: profile.displayName?.split(' ')[0] || null,
            lastName: profile.displayName?.split(' ').slice(1).join(' ') || null,
            profileImageUrl: profile.photos?.[0]?.value || null,
          });

          // Store tokens in session
          const sessionUser = {
            id: user.id,
            accessToken,
            refreshToken,
            expiresAt: Date.now() + (expires_in * 1000),
            profile: user,
          };

          return done(null, sessionUser);
        } catch (error) {
          console.error("Error in Spotify auth:", error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Auth routes
  app.get("/api/login", passport.authenticate("spotify", {
    scope: ["user-read-email", "playlist-modify-public", "playlist-modify-private"],
  }));

  app.get("/api/auth/spotify/callback",
    passport.authenticate("spotify", { failureRedirect: "/?error=auth_failed" }),
    (req, res) => {
      // Check if request is from mobile browser
      const userAgent = req.headers['user-agent'] || '';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      if (isMobile) {
        // For mobile, send HTML with JavaScript redirect to force proper navigation
        const redirectUrl = `${req.protocol}://${req.get('host')}/`;
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Redirecting...</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body>
            <script>
              window.location.replace('${redirectUrl}');
            </script>
            <p>Redirecting to Vibe Swipe...</p>
          </body>
          </html>
        `);
      } else {
        // For desktop, use standard redirect
        res.redirect('/');
      }
    }
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  // User info route
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user.profile;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;
  
  // Check if token is expired
  if (user.expiresAt && Date.now() >= user.expiresAt) {
    return res.status(401).json({ message: "Token expired" });
  }

  next();
};