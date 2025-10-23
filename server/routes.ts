import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertLinkSchema, insertGroupSchema } from "@shared/schema";
import { hashIP, hashUserAgent } from "./lib/encryption";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // ============================================================================
  // AUTH ROUTES
  // ============================================================================

  // Get current user - allows unauthenticated to return null
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.json(null);
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user || null);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============================================================================
  // LINK ROUTES
  // ============================================================================

  // Get all links for user
  app.get("/api/links", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const links = await storage.getLinks(userId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching links:", error);
      res.status(500).json({ message: "Failed to fetch links" });
    }
  });

  // Get single link by ID
  app.get("/api/links/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      
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

  // ============================================================================
  // GROUP ROUTES
  // ============================================================================

  // Get all groups for user
  app.get("/api/groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
      
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

  // Invite members to group
  app.post("/api/groups/:id/invite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

      // TODO: Send invitation emails
      // For now, just return success
      res.json({ success: true, invitedCount: emails.length });
    } catch (error) {
      console.error("Error inviting members:", error);
      res.status(500).json({ message: "Failed to invite members" });
    }
  });

  // Get group members
  app.get("/api/groups/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
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

          const share = await storage.createShare({
            linkId,
            sharedById: userId,
            targetType: "group",
            targetId: groupId,
          });
          shares.push(share);

          // Create notification for group members
          const members = await storage.getGroupMembers(groupId);
          for (const member of members) {
            if (member.userId !== userId) {
              await storage.createNotification({
                userId: member.userId,
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
      const userId = req.user.claims.sub;
      
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;

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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  return httpServer;
}
