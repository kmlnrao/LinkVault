import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, createLoginAudit } from "./auth";
import passport from "passport";
import { insertLinkSchema, insertGroupSchema } from "@shared/schema";
import { hashIP, hashUserAgent } from "./lib/encryption";
import argon2 from "argon2";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup new auth with OAuth providers
  setupAuth(app, {
    storage,
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    microsoft: {
      clientID: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
    },
    linkedin: {
      clientID: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
    },
    facebook: {
      clientID: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    },
  });

  // ============================================================================
  // AUTH ROUTES
  // ============================================================================

  // Get current user - allows unauthenticated to return null
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.id) {
        return res.json(null);
      }

      const user = await storage.getUser(req.user.id);
      res.json(user || null);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Google OAuth (only if credentials are provided)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get(
      "/api/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login" }),
      async (req, res) => {
        await createLoginAudit(storage, {
          userId: req.user?.id,
          email: req.user?.email || "",
          action: "login",
          provider: "google",
          ipAddress: req.ip || "",
          userAgent: req.headers["user-agent"] || "",
          success: true,
        });
        res.redirect("/");
      }
    );
  }

  // Microsoft OAuth (only if credentials are provided)
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    app.get("/api/auth/microsoft", passport.authenticate("microsoft"));

    app.get(
      "/api/auth/microsoft/callback",
      passport.authenticate("microsoft", { failureRedirect: "/login" }),
      async (req, res) => {
        await createLoginAudit(storage, {
          userId: req.user?.id,
          email: req.user?.email || "",
          action: "login",
          provider: "microsoft",
          ipAddress: req.ip || "",
          userAgent: req.headers["user-agent"] || "",
          success: true,
        });
        res.redirect("/");
      }
    );
  }

  // LinkedIn OAuth (only if credentials are provided)
  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    app.get("/api/auth/linkedin", passport.authenticate("linkedin"));

    app.get(
      "/api/auth/linkedin/callback",
      passport.authenticate("linkedin", { failureRedirect: "/login" }),
      async (req, res) => {
        await createLoginAudit(storage, {
          userId: req.user?.id,
          email: req.user?.email || "",
          action: "login",
          provider: "linkedin",
          ipAddress: req.ip || "",
          userAgent: req.headers["user-agent"] || "",
          success: true,
        });
        res.redirect("/");
      }
    );
  }

  // Facebook OAuth (only if credentials are provided)
  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    app.get("/api/auth/facebook", passport.authenticate("facebook"));

    app.get(
      "/api/auth/facebook/callback",
      passport.authenticate("facebook", { failureRedirect: "/login" }),
      async (req, res) => {
        await createLoginAudit(storage, {
          userId: req.user?.id,
          email: req.user?.email || "",
          action: "login",
          provider: "facebook",
          ipAddress: req.ip || "",
          userAgent: req.headers["user-agent"] || "",
          success: true,
        });
        res.redirect("/");
      }
    );
  }

  // Local auth - Signup
  app.post("/api/auth/signup", async (req: any, res) => {
    try {
      const { email, phone, password, firstName, lastName } = req.body;

      // Require at least email OR phone
      if ((!email && !phone) || !password) {
        return res
          .status(400)
          .json({ message: "Email or phone number and password are required" });
      }

      // Check if user already exists by email or phone
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "User with this email already exists" });
        }
      }
      
      if (phone) {
        const existingUser = await storage.getUserByPhone(phone);
        if (existingUser) {
          return res.status(400).json({ message: "User with this phone number already exists" });
        }
      }

      // Hash password
      const passwordHash = await argon2.hash(password);

      // Create user
      const user = await storage.upsertUser({
        email: email || null,
        phone: phone || null,
        firstName: firstName || null,
        lastName: lastName || null,
        passwordHash,
        emailVerified: email ? false : undefined,
        phoneVerified: phone ? false : undefined,
      });

      // Log in the user
      req.login(
        {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        },
        async (err: any) => {
          if (err) {
            return res.status(500).json({ message: "Failed to login after signup" });
          }

          await createLoginAudit(storage, {
            userId: user.id,
            email: user.email || user.phone || "",
            action: "signup",
            provider: "local",
            ipAddress: req.ip || "",
            userAgent: req.headers["user-agent"] || "",
            success: true,
          });

          res.status(201).json(user);
        }
      );
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Local auth - Login
  app.post("/api/auth/login", (req: any, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        await createLoginAudit(storage, {
          email: req.body.username || "",
          action: "login_failed",
          provider: "local",
          ipAddress: req.ip || "",
          userAgent: req.headers["user-agent"] || "",
          success: false,
          failureReason: info?.message || "Invalid credentials",
        });
        return res.status(401).json({ message: info?.message || "Login failed" });
      }

      req.login(user, async (loginErr: any) => {
        if (loginErr) {
          return next(loginErr);
        }

        await createLoginAudit(storage, {
          userId: user.id,
          email: user.email || user.phone || "",
          action: "login",
          provider: "local",
          ipAddress: req.ip || "",
          userAgent: req.headers["user-agent"] || "",
          success: true,
        });

        res.json(user);
      });
    })(req, res, next);
  });

  // Logout (POST for API, GET for link redirect)
  const handleLogout = (req: any, res: any) => {
    req.logout((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      req.session.destroy((destroyErr: any) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        res.clearCookie("connect.sid");
        // For GET requests, redirect to login page
        if (req.method === "GET") {
          return res.redirect("/login");
        }
        // For POST requests, return JSON
        res.json({ message: "Logged out successfully" });
      });
    });
  };

  app.post("/api/auth/logout", handleLogout);
  app.get("/api/logout", handleLogout);

  // Request password reset
  app.post("/api/auth/forgot-password", async (req: any, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Return success even if user doesn't exist to prevent email enumeration
        return res.json({ message: "If an account exists with that email, a password reset link has been sent" });
      }

      // Generate secure random token
      const crypto = await import("crypto");
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

      // Store token with 1 hour expiration
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await storage.createPasswordResetToken({
        userId: user.id,
        token: hashedToken,
        expiresAt,
        used: false,
      });

      // TODO: Integrate email service to send password reset link
      // The reset link should be: `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}`
      // NEVER log the plaintext token - it should only be sent via secure email delivery

      await createLoginAudit(storage, {
        userId: user.id,
        email: user.email || "",
        action: "password_reset_requested",
        provider: "local",
        ipAddress: req.ip || "",
        userAgent: req.headers["user-agent"] || "",
        success: true,
      });

      res.json({ message: "If an account exists with that email, a password reset link has been sent" });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req: any, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Hash the token to match stored hash
      const crypto = await import("crypto");
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

      const resetToken = await storage.getPasswordResetToken(hashedToken);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      if (resetToken.used) {
        return res.status(400).json({ message: "Reset token has already been used" });
      }

      if (resetToken.expiresAt < new Date()) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Hash new password with Argon2
      const passwordHash = await argon2.hash(newPassword);

      // Update user's password
      await storage.updateUser(resetToken.userId, {
        passwordHash,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      });

      // Mark token as used
      await storage.markTokenAsUsed(hashedToken);

      // Get user for audit log
      const user = await storage.getUser(resetToken.userId);

      await createLoginAudit(storage, {
        userId: resetToken.userId,
        email: user?.email || "",
        action: "password_reset",
        provider: "local",
        ipAddress: req.ip || "",
        userAgent: req.headers["user-agent"] || "",
        success: true,
      });

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ============================================================================
  // LINK ROUTES
  // ============================================================================

  // Get all links for user
  app.get("/api/links", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const links = await storage.getLinks(userId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching links:", error);
      res.status(500).json({ message: "Failed to fetch links" });
    }
  });

  // Get links shared with current user
  app.get("/api/links/shared/with-me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get all shares where this user is the target
      const shares = await storage.getSharesWithUser(userId);
      
      // Get link details for each share
      const links = await Promise.all(
        shares.map(async (share: any) => {
          const link = await storage.getLinkById(share.linkId!);
          if (!link) return null;
          
          // Add metadata about who shared it
          return {
            ...link,
            sharedById: share.sharedById,
            sharedAt: share.createdAt,
          };
        })
      );

      // Filter out any null links
      const validLinks = links.filter((link: any) => link !== null);

      res.json(validLinks);
    } catch (error) {
      console.error("Error fetching shared links:", error);
      res.status(500).json({ message: "Failed to fetch shared links" });
    }
  });

  // Get single link by ID
  app.get("/api/links/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const link = await storage.getLinkById(req.params.id);

      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }

      // Check if user owns the link
      if (link.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(link);
    } catch (error) {
      console.error("Error fetching link:", error);
      res.status(500).json({ message: "Failed to fetch link" });
    }
  });

  // Create new link
  app.post("/api/links", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate request body
      const validatedData = insertLinkSchema.parse(req.body);

      const link = await storage.createLink(userId, validatedData);
      res.status(201).json(link);
    } catch (error: any) {
      console.error("Error creating link:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid link data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create link" });
    }
  });

  // Update link
  app.patch("/api/links/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Verify link exists and user owns it before updating
      const existingLink = await storage.getLinkById(req.params.id);
      if (!existingLink) {
        return res.status(404).json({ message: "Link not found" });
      }
      if (existingLink.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate update data (partial schema)
      const updateData = insertLinkSchema.partial().parse(req.body);
      const link = await storage.updateLink(req.params.id, userId, updateData);

      if (!link) {
        return res.status(404).json({ message: "Link not found or access denied" });
      }

      res.json(link);
    } catch (error: any) {
      console.error("Error updating link:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid link data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update link" });
    }
  });

  // Archive/Unarchive link
  app.patch("/api/links/:id/archive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { archive } = req.body;

      const success = await storage.archiveLink(req.params.id, userId, archive);

      if (!success) {
        return res.status(404).json({ message: "Link not found or access denied" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error archiving link:", error);
      res.status(500).json({ message: "Failed to archive link" });
    }
  });

  // Delete link
  app.delete("/api/links/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Verify ownership before deleting
      const link = await storage.getLinkById(req.params.id);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }
      if (link.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deleteLink(req.params.id, userId);

      if (!success) {
        return res.status(404).json({ message: "Link not found or access denied" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting link:", error);
      res.status(500).json({ message: "Failed to delete link" });
    }
  });

  // Share link with groups or users
  app.post("/api/links/:id/share", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const linkId = req.params.id;
      const { targetType, targetIds } = req.body;

      // Verify ownership
      const link = await storage.getLinkById(linkId);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }
      if (link.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!targetType || !targetIds || !Array.isArray(targetIds)) {
        return res.status(400).json({ message: "targetType and targetIds (array) are required" });
      }

      if (targetType !== "group" && targetType !== "contact") {
        return res.status(400).json({ message: "targetType must be 'group' or 'contact'" });
      }

      // Create shares
      const shares = await Promise.all(
        targetIds.map((targetId: string) =>
          storage.createShare(userId, {
            linkId,
            targetType,
            targetId,
          })
        )
      );

      res.json(shares);
    } catch (error) {
      console.error("Error sharing link:", error);
      res.status(500).json({ message: "Failed to share link" });
    }
  });

  // Get who a link is shared with
  app.get("/api/links/:id/shares", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const linkId = req.params.id;

      // Verify ownership
      const link = await storage.getLinkById(linkId);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }
      if (link.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const shares = await storage.getSharesByLink(linkId);

      // Enrich shares with details
      const enrichedShares = await Promise.all(
        shares.map(async (share: any) => {
          if (share.targetType === "group") {
            const group = await storage.getGroupById(share.targetId);
            return {
              ...share,
              target: group,
            };
          } else if (share.targetType === "contact") {
            const user = await storage.getUser(share.targetId);
            return {
              ...share,
              target: user,
            };
          }
          return share;
        })
      );

      res.json(enrichedShares);
    } catch (error) {
      console.error("Error fetching link shares:", error);
      res.status(500).json({ message: "Failed to fetch link shares" });
    }
  });

  // Unshare link from group or user
  app.delete("/api/links/:linkId/shares/:shareId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { linkId, shareId } = req.params;

      // Verify ownership
      const link = await storage.getLinkById(linkId);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }
      if (link.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deleteShare(shareId);

      if (!success) {
        return res.status(404).json({ message: "Share not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error unsharing link:", error);
      res.status(500).json({ message: "Failed to unshare link" });
    }
  });

  // Get click analytics for a link
  app.get("/api/links/:id/clicks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const linkId = req.params.id;

      // Verify ownership
      const link = await storage.getLinkById(linkId);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }
      if (link.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const clicks = await storage.getClicksByLink(linkId);
      res.json(clicks);
    } catch (error) {
      console.error("Error fetching link clicks:", error);
      res.status(500).json({ message: "Failed to fetch link clicks" });
    }
  });

  // ============================================================================
  // USER ROUTES
  // ============================================================================

  // Search/list users (for sharing links)
  app.get("/api/users", isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.q || "";
      const users = await storage.searchUsers(query);
      
      // Don't return sensitive fields
      const safeUsers = users.map((user: any) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      }));

      res.json(safeUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // ============================================================================
  // GROUP ROUTES
  // ============================================================================

  // Get all groups for user
  app.get("/api/groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const groups = await storage.getGroups(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  // Get single group by ID
  app.get("/api/groups/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const group = await storage.getGroupById(req.params.id);

      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      // Check if user is owner or member of this group
      if (group.ownerId !== userId) {
        const members = await storage.getGroupMembers(req.params.id);
        const isMember = members.some((m) => m.userId === userId);
        if (!isMember) {
          return res.status(403).json({ message: "Access denied. You must be a group member to view this group." });
        }
      }

      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  // Create new group
  app.post("/api/groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate request body
      const validatedData = insertGroupSchema.parse(req.body);

      const group = await storage.createGroup(userId, validatedData);
      res.status(201).json(group);
    } catch (error: any) {
      console.error("Error creating group:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid group data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  // Update group
  app.patch("/api/groups/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Verify group exists and user owns it
      const existingGroup = await storage.getGroupById(req.params.id);
      if (!existingGroup) {
        return res.status(404).json({ message: "Group not found" });
      }
      if (existingGroup.ownerId !== userId) {
        return res.status(403).json({ message: "Only group owner can edit group" });
      }

      // Validate update data
      const updateData = insertGroupSchema.partial().parse(req.body);
      const group = await storage.updateGroup(req.params.id, userId, updateData);

      if (!group) {
        return res.status(404).json({ message: "Group not found or access denied" });
      }

      res.json(group);
    } catch (error: any) {
      console.error("Error updating group:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid group data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update group" });
    }
  });

  // Delete group
  app.delete("/api/groups/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Verify ownership before deleting
      const group = await storage.getGroupById(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      if (group.ownerId !== userId) {
        return res.status(403).json({ message: "Only group owner can delete group" });
      }

      const success = await storage.deleteGroup(req.params.id, userId);

      if (!success) {
        return res.status(404).json({ message: "Group not found or access denied" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  // Get group members
  app.get("/api/groups/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const groupId = req.params.id;

      // Verify group exists and user has access
      const group = await storage.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      // Check if user is owner or member
      const members = await storage.getGroupMembers(groupId);
      const hasAccess = group.ownerId === userId || members.some(m => m.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied. You must be a member of this group." });
      }

      // Get full member details with user info
      const membersWithUsers = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          return {
            ...member,
            user,
          };
        })
      );

      res.json(membersWithUsers);
    } catch (error) {
      console.error("Error fetching group members:", error);
      res.status(500).json({ message: "Failed to fetch group members" });
    }
  });

  // Get links shared with a group
  app.get("/api/groups/:id/links", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const groupId = req.params.id;

      // Verify group exists and user has access
      const group = await storage.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      // Check if user is owner or member
      const members = await storage.getGroupMembers(groupId);
      const hasAccess = group.ownerId === userId || members.some(m => m.userId === userId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied. You must be a member of this group." });
      }

      // Get all shares for this group
      const shares = await storage.getSharesByGroup(groupId);
      
      // Get link details for each share
      const links = await Promise.all(
        shares
          .filter((share: any) => share.linkId)
          .map(async (share: any) => {
            const link = await storage.getLinkById(share.linkId!);
            return link;
          })
      );

      // Filter out any undefined links
      const validLinks = links.filter((link: any) => link !== undefined);

      res.json(validLinks);
    } catch (error) {
      console.error("Error fetching group links:", error);
      res.status(500).json({ message: "Failed to fetch group links" });
    }
  });

  // Remove member from group
  app.delete("/api/groups/:id/members/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const groupId = req.params.id;
      const targetUserId = req.params.userId;

      // Verify group exists
      const group = await storage.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      // Only group owner can remove members
      if (group.ownerId !== currentUserId) {
        return res.status(403).json({ message: "Only group owner can remove members" });
      }

      // Can't remove the owner
      if (targetUserId === group.ownerId) {
        return res.status(400).json({ message: "Cannot remove group owner" });
      }

      const success = await storage.removeGroupMember(groupId, targetUserId);

      if (!success) {
        return res.status(404).json({ message: "Member not found in group" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error removing group member:", error);
      res.status(500).json({ message: "Failed to remove group member" });
    }
  });

  // Invite members to group
  app.post("/api/groups/:id/invite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { emails } = req.body;

      if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ message: "Invalid email list" });
      }

      // Get group to verify ownership
      const group = await storage.getGroupById(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      if (group.ownerId !== userId) {
        return res.status(403).json({ message: "Only group owner can invite members" });
      }

      // Get inviter info
      const inviter = await storage.getUser(userId);
      const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}` : "Someone";

      let successCount = 0;
      let notFoundEmails: string[] = [];

      // Create notifications for users who have accounts
      for (const email of emails) {
        const targetUser = await storage.getUserByEmail(email);
        
        if (targetUser) {
          // Check if user is already a member
          const members = await storage.getGroupMembers(group.id);
          const isAlreadyMember = members.some(m => m.userId === targetUser.id);
          
          if (!isAlreadyMember) {
            // Create notification for the invited user
            await storage.createNotification(targetUser.id, {
              type: "group_invite",
              title: `Group Invitation from ${inviterName}`,
              message: `${inviterName} invited you to join "${group.name}"`,
              groupId: group.id,
            });
            successCount++;
          }
        } else {
          notFoundEmails.push(email);
        }
      }

      res.json({ 
        success: true, 
        invitedCount: successCount,
        notFoundEmails: notFoundEmails.length > 0 ? notFoundEmails : undefined,
        message: notFoundEmails.length > 0 
          ? `Invited ${successCount} users. ${notFoundEmails.length} email(s) not found - they need to sign up first.`
          : `Successfully invited ${successCount} user(s)`
      });
    } catch (error) {
      console.error("Error inviting members:", error);
      res.status(500).json({ message: "Failed to invite members" });
    }
  });

  // Get group members
  app.get("/api/groups/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Verify group exists
      const group = await storage.getGroupById(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      // Check if user is owner or member of this group
      if (group.ownerId !== userId) {
        const members = await storage.getGroupMembers(req.params.id);
        const isMember = members.some((m) => m.userId === userId);
        if (!isMember) {
          return res.status(403).json({ message: "Access denied. Only group members can view the member list." });
        }
      }

      const members = await storage.getGroupMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // ============================================================================
  // SHARE ROUTES
  // ============================================================================

  // Share link with groups
  app.post("/api/shares", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { linkId, targetType, groupIds } = req.body;

      if (!linkId || !targetType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify link ownership
      const link = await storage.getLinkById(linkId);
      if (!link || link.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied. You must own this link to share it." });
      }

      // Create shares for each group
      const shares = [];
      if (targetType === "group" && Array.isArray(groupIds)) {
        for (const groupId of groupIds) {
          // Verify user owns or is member of target group before sharing
          const group = await storage.getGroupById(groupId);
          if (!group) {
            return res.status(404).json({ message: `Group ${groupId} not found` });
          }
          
          // Check if user is owner or member of this group
          if (group.ownerId !== userId) {
            const members = await storage.getGroupMembers(groupId);
            const isMember = members.some((m) => m.userId === userId);
            if (!isMember) {
              return res.status(403).json({ 
                message: `Access denied. You must be a member of all target groups to share links with them.` 
              });
            }
          }

          const share = await storage.createShare(userId, {
            linkId,
            targetType: "group",
            targetId: groupId,
          });
          shares.push(share);

          // Create notification for group members
          const members = await storage.getGroupMembers(groupId);
          for (const member of members) {
            if (member.userId !== userId) {
              await storage.createNotification(member.userId, {
                type: "link_shared",
                title: "New link shared",
                message: `${link.title} was shared with your group`,
                linkId,
                groupId,
              });
            }
          }
        }
      }

      res.status(201).json({ success: true, shares });
    } catch (error) {
      console.error("Error sharing link:", error);
      res.status(500).json({ message: "Failed to share link" });
    }
  });

  // Get shares for a link
  app.get("/api/shares/link/:linkId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Verify link exists and user owns it
      const link = await storage.getLinkById(req.params.linkId);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }
      if (link.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied. You must own this link to view its shares." });
      }

      const shares = await storage.getSharesByLink(req.params.linkId);
      res.json(shares);
    } catch (error) {
      console.error("Error fetching shares:", error);
      res.status(500).json({ message: "Failed to fetch shares" });
    }
  });

  // ============================================================================
  // CLICK TRACKING ROUTES
  // ============================================================================

  // Record a click event
  app.post("/api/clicks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { linkId } = req.body;

      if (!linkId) {
        return res.status(400).json({ message: "Link ID required" });
      }

      // Verify link exists and user has access to it
      const link = await storage.getLinkById(linkId);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }

      // Allow clicks only if:
      // 1. User owns the link, OR
      // 2. Link is shared with a group the user belongs to
      if (link.ownerId !== userId) {
        // Check if link is shared with any group the user belongs to
        const shares = await storage.getSharesByLink(linkId);
        const userGroups = await storage.getGroups(userId);
        const userGroupIds = userGroups.map((g) => g.id);
        
        const hasAccess = shares.some(
          (share) =>
            share.targetType === "group" &&
            share.targetId &&
            userGroupIds.includes(share.targetId)
        );

        if (!hasAccess) {
          return res.status(403).json({ 
            message: "Access denied. You must own this link or belong to a group it's shared with." 
          });
        }
      }

      const ip = req.ip || req.connection.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";

      const event = await storage.recordClick({
        linkId,
        userId,
        ipHash: hashIP(ip),
        userAgentHash: hashUserAgent(userAgent),
      });

      res.status(201).json(event);
    } catch (error) {
      console.error("Error recording click:", error);
      res.status(500).json({ message: "Failed to record click" });
    }
  });

  // Get click analytics for a link
  app.get("/api/clicks/link/:linkId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Verify link ownership
      const link = await storage.getLinkById(req.params.linkId);
      if (!link || link.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const clicks = await storage.getClicksByLink(req.params.linkId);
      res.json(clicks);
    } catch (error) {
      console.error("Error fetching clicks:", error);
      res.status(500).json({ message: "Failed to fetch clicks" });
    }
  });

  // ============================================================================
  // NOTIFICATION ROUTES
  // ============================================================================

  // Get notifications for user
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.markNotificationRead(req.params.id, userId);

      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // Accept group invitation
  app.post("/api/notifications/:id/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get notification
      const notifications = await storage.getNotifications(userId);
      const notification = notifications.find(n => n.id === req.params.id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      if (notification.type !== "group_invite") {
        return res.status(400).json({ message: "This notification is not a group invitation" });
      }

      if (!notification.groupId) {
        return res.status(400).json({ message: "Invalid invitation - no group specified" });
      }

      // Verify group still exists
      const group = await storage.getGroupById(notification.groupId);
      if (!group) {
        // Mark notification as read and return error
        await storage.markNotificationRead(req.params.id, userId);
        return res.status(404).json({ message: "This group no longer exists" });
      }

      // Check if already a member
      const members = await storage.getGroupMembers(notification.groupId);
      const isAlreadyMember = members.some(m => m.userId === userId);

      if (isAlreadyMember) {
        // Mark notification as read
        await storage.markNotificationRead(req.params.id, userId);
        return res.status(400).json({ message: "You are already a member of this group" });
      }

      // Add user to group
      await storage.addGroupMember({
        groupId: notification.groupId,
        userId,
        role: "member",
      });

      // Mark notification as read
      await storage.markNotificationRead(req.params.id, userId);

      res.json({ success: true, message: `You joined "${group.name}"` });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // Decline group invitation
  app.post("/api/notifications/:id/decline", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get notification
      const notifications = await storage.getNotifications(userId);
      const notification = notifications.find(n => n.id === req.params.id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      if (notification.type !== "group_invite") {
        return res.status(400).json({ message: "This notification is not a group invitation" });
      }

      // Simply mark as read (declining = ignoring)
      await storage.markNotificationRead(req.params.id, userId);

      res.json({ success: true, message: "Invitation declined" });
    } catch (error) {
      console.error("Error declining invitation:", error);
      res.status(500).json({ message: "Failed to decline invitation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
