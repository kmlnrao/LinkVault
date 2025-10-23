import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// @ts-ignore - No types available
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
// @ts-ignore - No types available
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as LocalStrategy } from "passport-local";
import argon2 from "argon2";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, Request } from "express";
import type { IStorage } from "./storage";
import type { User } from "@shared/schema";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
    }
  }
}

interface AuthConfig {
  storage: IStorage;
  google?: {
    clientID: string;
    clientSecret: string;
  };
  microsoft?: {
    clientID: string;
    clientSecret: string;
  };
  linkedin?: {
    clientID: string;
    clientSecret: string;
  };
  facebook?: {
    clientID: string;
    clientSecret: string;
  };
}

export function setupAuth(app: Express, config: AuthConfig) {
  const { storage } = config;
  const baseURL = process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
    : "http://localhost:5000";

  // ============================================================================
  // SESSION SETUP
  // ============================================================================

  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.set("trust proxy", 1);
  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Only secure in production
        maxAge: sessionTtl,
      },
    })
  );

  // Initialize passport and session
  app.use(passport.initialize());
  app.use(passport.session());

  // ============================================================================
  // PASSPORT SERIALIZATION
  // ============================================================================

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      done(error);
    }
  });

  // ============================================================================
  // GOOGLE OAUTH STRATEGY
  // ============================================================================

  if (config.google?.clientID && config.google?.clientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.google.clientID,
          clientSecret: config.google.clientSecret,
          callbackURL: `${baseURL}/api/auth/google/callback`,
          scope: ["profile", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if auth account exists
            let authAccount = await storage.getAuthAccountByProvider(
              "google",
              profile.id
            );

            let user: User;

            if (authAccount) {
              // Update existing tokens
              await storage.updateAuthAccount(authAccount.id, {
                accessToken,
                refreshToken: refreshToken || authAccount.refreshToken,
                expiresAt: new Date(Date.now() + 3600 * 1000),
                profilePayload: profile._json,
              });
              user = (await storage.getUser(authAccount.userId))!;
            } else {
              // Find user by email or create new
              const email = profile.emails?.[0]?.value || null;
              let existingUser = email
                ? await storage.getUserByEmail(email)
                : null;

              if (existingUser) {
                user = existingUser;
              } else {
                // Create new user
                user = await storage.upsertUser({
                  email,
                  firstName: profile.name?.givenName || null,
                  lastName: profile.name?.familyName || null,
                  profileImageUrl: profile.photos?.[0]?.value || null,
                  emailVerified: true,
                });
              }

              // Create auth account
              await storage.createAuthAccount({
                userId: user.id,
                provider: "google",
                providerAccountId: profile.id,
                accessToken,
                refreshToken: refreshToken || null,
                expiresAt: new Date(Date.now() + 3600 * 1000),
                scope: "profile email",
                profilePayload: profile._json,
              });
            }

            // Update last login
            await storage.updateUser(user.id, {
              lastLoginAt: new Date(),
              failedLoginAttempts: 0,
            });

            done(null, {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
            });
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  // ============================================================================
  // MICROSOFT OAUTH STRATEGY
  // ============================================================================

  if (config.microsoft?.clientID && config.microsoft?.clientSecret) {
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: config.microsoft.clientID,
          clientSecret: config.microsoft.clientSecret,
          callbackURL: `${baseURL}/api/auth/microsoft/callback`,
          scope: ["user.read"],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            let authAccount = await storage.getAuthAccountByProvider(
              "microsoft",
              profile.id
            );

            let user: User;

            if (authAccount) {
              await storage.updateAuthAccount(authAccount.id, {
                accessToken,
                refreshToken: refreshToken || authAccount.refreshToken,
                expiresAt: new Date(Date.now() + 3600 * 1000),
                profilePayload: profile._json,
              });
              user = (await storage.getUser(authAccount.userId))!;
            } else {
              const email = profile.emails?.[0]?.value || null;
              let existingUser = email
                ? await storage.getUserByEmail(email)
                : null;

              if (existingUser) {
                user = existingUser;
              } else {
                user = await storage.upsertUser({
                  email,
                  firstName: profile.name?.givenName || null,
                  lastName: profile.name?.familyName || null,
                  profileImageUrl: null,
                  emailVerified: true,
                });
              }

              await storage.createAuthAccount({
                userId: user.id,
                provider: "microsoft",
                providerAccountId: profile.id,
                accessToken,
                refreshToken: refreshToken || null,
                expiresAt: new Date(Date.now() + 3600 * 1000),
                scope: "user.read",
                profilePayload: profile._json,
              });
            }

            await storage.updateUser(user.id, {
              lastLoginAt: new Date(),
              failedLoginAttempts: 0,
            });

            done(null, {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
            });
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  // ============================================================================
  // LINKEDIN OAUTH STRATEGY
  // ============================================================================

  if (config.linkedin?.clientID && config.linkedin?.clientSecret) {
    passport.use(
      new LinkedInStrategy(
        {
          clientID: config.linkedin.clientID,
          clientSecret: config.linkedin.clientSecret,
          callbackURL: `${baseURL}/api/auth/linkedin/callback`,
          scope: ["r_emailaddress", "r_liteprofile"],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            let authAccount = await storage.getAuthAccountByProvider(
              "linkedin",
              profile.id
            );

            let user: User;

            if (authAccount) {
              await storage.updateAuthAccount(authAccount.id, {
                accessToken,
                refreshToken: refreshToken || authAccount.refreshToken,
                expiresAt: new Date(Date.now() + 3600 * 1000),
                profilePayload: profile._json,
              });
              user = (await storage.getUser(authAccount.userId))!;
            } else {
              const email = profile.emails?.[0]?.value || null;
              let existingUser = email
                ? await storage.getUserByEmail(email)
                : null;

              if (existingUser) {
                user = existingUser;
              } else {
                user = await storage.upsertUser({
                  email,
                  firstName: profile.name?.givenName || null,
                  lastName: profile.name?.familyName || null,
                  profileImageUrl: profile.photos?.[0]?.value || null,
                  emailVerified: true,
                });
              }

              await storage.createAuthAccount({
                userId: user.id,
                provider: "linkedin",
                providerAccountId: profile.id,
                accessToken,
                refreshToken: refreshToken || null,
                expiresAt: new Date(Date.now() + 3600 * 1000),
                scope: "r_emailaddress r_liteprofile",
                profilePayload: profile._json,
              });
            }

            await storage.updateUser(user.id, {
              lastLoginAt: new Date(),
              failedLoginAttempts: 0,
            });

            done(null, {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
            });
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  // ============================================================================
  // FACEBOOK OAUTH STRATEGY
  // ============================================================================

  if (config.facebook?.clientID && config.facebook?.clientSecret) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: config.facebook.clientID,
          clientSecret: config.facebook.clientSecret,
          callbackURL: `${baseURL}/api/auth/facebook/callback`,
          profileFields: ["id", "emails", "name", "picture"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let authAccount = await storage.getAuthAccountByProvider(
              "facebook",
              profile.id
            );

            let user: User;

            if (authAccount) {
              await storage.updateAuthAccount(authAccount.id, {
                accessToken,
                refreshToken: refreshToken || authAccount.refreshToken,
                expiresAt: new Date(Date.now() + 3600 * 1000),
                profilePayload: profile._json,
              });
              user = (await storage.getUser(authAccount.userId))!;
            } else {
              const email = profile.emails?.[0]?.value || null;
              let existingUser = email
                ? await storage.getUserByEmail(email)
                : null;

              if (existingUser) {
                user = existingUser;
              } else {
                user = await storage.upsertUser({
                  email,
                  firstName: profile.name?.givenName || null,
                  lastName: profile.name?.familyName || null,
                  profileImageUrl: profile.photos?.[0]?.value || null,
                  emailVerified: true,
                });
              }

              await storage.createAuthAccount({
                userId: user.id,
                provider: "facebook",
                providerAccountId: profile.id,
                accessToken,
                refreshToken: refreshToken || null,
                expiresAt: new Date(Date.now() + 3600 * 1000),
                scope: "email public_profile",
                profilePayload: profile._json,
              });
            }

            await storage.updateUser(user.id, {
              lastLoginAt: new Date(),
              failedLoginAttempts: 0,
            });

            done(null, {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
            });
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  // ============================================================================
  // LOCAL STRATEGY (Email/Password)
  // ============================================================================

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);

          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Check if account is locked
          if (
            user.accountLockedUntil &&
            new Date(user.accountLockedUntil) > new Date()
          ) {
            return done(null, false, {
              message: "Account is temporarily locked. Please try again later.",
            });
          }

          // Check if user has a password set
          if (!user.passwordHash) {
            return done(null, false, {
              message:
                "Please sign in with your OAuth provider (Google, Microsoft, etc.)",
            });
          }

          // Verify password
          const valid = await argon2.verify(user.passwordHash, password);

          if (!valid) {
            // Increment failed attempts
            const newAttempts = (user.failedLoginAttempts || 0) + 1;
            const updates: any = {
              failedLoginAttempts: newAttempts,
            };

            // Lock account after 5 failed attempts
            if (newAttempts >= 5) {
              updates.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            }

            await storage.updateUser(user.id, updates);

            return done(null, false, { message: "Invalid email or password" });
          }

          // Successful login - reset failed attempts
          await storage.updateUser(user.id, {
            lastLoginAt: new Date(),
            failedLoginAttempts: 0,
            accountLockedUntil: null,
          });

          done(null, {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          });
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  return passport;
}

// Helper function to create audit log
export async function createLoginAudit(
  storage: IStorage,
  data: {
    userId?: string;
    email: string;
    action: string;
    provider?: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    failureReason?: string;
  }
) {
  await storage.createAuditLog({
    userId: data.userId || null,
    email: data.email,
    action: data.action,
    provider: data.provider || null,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    success: data.success,
    failureReason: data.failureReason || null,
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}
