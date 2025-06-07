import passport from "passport";
import { Strategy as SpotifyStrategy } from "passport-spotify";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
  throw new Error("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set");
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
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
    secret: process.env.SESSION_SECRET || "vibe-swipe-secret-key",
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

  // Get the current domain for callback URL
  const domain = process.env.REPLIT_DOMAINS!.split(",")[0];
  const callbackURL = `https://${domain}/api/callback`;

  passport.use(
    new SpotifyStrategy(
      {
        clientID: process.env.SPOTIFY_CLIENT_ID!,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
        callbackURL,
      },
      async (accessToken, refreshToken, expires_in, profile, done) => {
        try {
          // Store user data from Spotify profile
          const userData = {
            id: profile.id,
            email: profile.emails?.[0]?.value || null,
            firstName: profile.displayName?.split(" ")[0] || null,
            lastName: profile.displayName?.split(" ").slice(1).join(" ") || null,
            profileImageUrl: profile.photos?.[0]?.value || null,
          };

          const user = await storage.upsertUser(userData);
          
          // Store tokens for API calls
          const userWithTokens = {
            ...user,
            accessToken,
            refreshToken,
            expiresIn: expires_in,
            expiresAt: Date.now() + (expires_in * 1000),
          };

          return done(null, userWithTokens);
        } catch (error) {
          return done(error as Error, null);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Auth routes
  app.get("/api/login", passport.authenticate("spotify", {
    scope: [
      "user-read-email",
      "user-read-private",
      "playlist-modify-public",
      "playlist-modify-private",
      "user-library-read",
      "user-top-read"
    ],
  }));

  app.get(
    "/api/callback",
    passport.authenticate("spotify", { failureRedirect: "/api/login" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};