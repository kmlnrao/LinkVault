import {
  users,
  links,
  groups,
  groupMemberships,
  shares,
  clickEvents,
  notifications,
  type User,
  type UpsertUser,
  type Link,
  type InsertLink,
  type Group,
  type InsertGroup,
  type GroupMembership,
  type InsertGroupMembership,
  type Share,
  type InsertShare,
  type ClickEvent,
  type InsertClickEvent,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { encrypt, decrypt, generateInviteCode, generateShareToken } from "./lib/encryption";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Link operations
  getLinks(userId: string): Promise<Link[]>;
  getLinkById(id: string): Promise<Link | undefined>;
  createLink(userId: string, link: InsertLink): Promise<Link>;
  updateLink(id: string, userId: string, updates: Partial<InsertLink>): Promise<Link | undefined>;
  deleteLink(id: string, userId: string): Promise<boolean>;
  archiveLink(id: string, userId: string, archive: boolean): Promise<boolean>;
  incrementLinkClicks(linkId: string): Promise<void>;

  // Group operations
  getGroups(userId: string): Promise<Group[]>;
  getGroupById(id: string): Promise<Group | undefined>;
  createGroup(userId: string, group: InsertGroup): Promise<Group>;
  updateGroup(id: string, userId: string, updates: Partial<InsertGroup>): Promise<Group | undefined>;
  deleteGroup(id: string, userId: string): Promise<boolean>;

  // Group membership operations
  addGroupMember(membership: InsertGroupMembership): Promise<GroupMembership>;
  removeGroupMember(groupId: string, userId: string): Promise<boolean>;
  getGroupMembers(groupId: string): Promise<GroupMembership[]>;

  // Share operations
  createShare(share: InsertShare): Promise<Share>;
  getSharesByLink(linkId: string): Promise<Share[]>;
  getSharesByUser(userId: string): Promise<Share[]>;

  // Click event operations
  recordClick(event: InsertClickEvent): Promise<ClickEvent>;
  getClicksByLink(linkId: string): Promise<ClickEvent[]>;

  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // ============================================================================
  // USER OPERATIONS
  // ============================================================================

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // ============================================================================
  // LINK OPERATIONS
  // ============================================================================

  async getLinks(userId: string): Promise<Link[]> {
    const userLinks = await db
      .select()
      .from(links)
      .where(eq(links.ownerId, userId))
      .orderBy(desc(links.createdAt));
    
    // Decrypt URLs and notes before returning
    return userLinks.map((link) => ({
      ...link,
      urlEncrypted: decrypt(link.urlEncrypted),
      notesEncrypted: link.notesEncrypted ? decrypt(link.notesEncrypted) : null,
    }));
  }

  async getLinkById(id: string): Promise<Link | undefined> {
    const [link] = await db.select().from(links).where(eq(links.id, id));
    if (!link) return undefined;

    return {
      ...link,
      urlEncrypted: decrypt(link.urlEncrypted),
      notesEncrypted: link.notesEncrypted ? decrypt(link.notesEncrypted) : null,
    };
  }

  async createLink(userId: string, linkData: InsertLink): Promise<Link> {
    // Encrypt URL and notes
    const encryptedData = {
      ...linkData,
      ownerId: userId,
      urlEncrypted: encrypt(linkData.urlEncrypted),
      notesEncrypted: linkData.notesEncrypted
        ? encrypt(linkData.notesEncrypted)
        : null,
    };

    const [link] = await db.insert(links).values(encryptedData).returning();

    return {
      ...link,
      urlEncrypted: decrypt(link.urlEncrypted),
      notesEncrypted: link.notesEncrypted ? decrypt(link.notesEncrypted) : null,
    };
  }

  async updateLink(
    id: string,
    userId: string,
    updates: Partial<InsertLink>
  ): Promise<Link | undefined> {
    // Encrypt URL and notes if provided
    const encryptedUpdates: any = {
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.urlEncrypted) {
      encryptedUpdates.urlEncrypted = encrypt(updates.urlEncrypted);
    }
    if (updates.notesEncrypted) {
      encryptedUpdates.notesEncrypted = encrypt(updates.notesEncrypted);
    }

    const [link] = await db
      .update(links)
      .set(encryptedUpdates)
      .where(and(eq(links.id, id), eq(links.ownerId, userId)))
      .returning();

    if (!link) return undefined;

    return {
      ...link,
      urlEncrypted: decrypt(link.urlEncrypted),
      notesEncrypted: link.notesEncrypted ? decrypt(link.notesEncrypted) : null,
    };
  }

  async deleteLink(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(links)
      .where(and(eq(links.id, id), eq(links.ownerId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async archiveLink(id: string, userId: string, archive: boolean): Promise<boolean> {
    const [link] = await db
      .update(links)
      .set({ isArchived: archive, updatedAt: new Date() })
      .where(and(eq(links.id, id), eq(links.ownerId, userId)))
      .returning();
    return !!link;
  }

  async incrementLinkClicks(linkId: string): Promise<void> {
    await db
      .update(links)
      .set({ clickCount: sql`${links.clickCount} + 1`, updatedAt: new Date() })
      .where(eq(links.id, linkId));
  }

  // ============================================================================
  // GROUP OPERATIONS
  // ============================================================================

  async getGroups(userId: string): Promise<Group[]> {
    // Get groups owned by user or where user is a member
    const userGroups = await db
      .select({ group: groups })
      .from(groups)
      .leftJoin(groupMemberships, eq(groups.id, groupMemberships.groupId))
      .where(or(eq(groups.ownerId, userId), eq(groupMemberships.userId, userId)))
      .orderBy(desc(groups.createdAt));

    // Remove duplicates
    const uniqueGroups = Array.from(
      new Map(userGroups.map((item) => [item.group.id, item.group])).values()
    );

    return uniqueGroups;
  }

  async getGroupById(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async createGroup(userId: string, groupData: InsertGroup): Promise<Group> {
    const inviteCode = generateInviteCode();

    const [group] = await db
      .insert(groups)
      .values({
        ...groupData,
        ownerId: userId,
        inviteCode,
      })
      .returning();

    // Add owner as member
    await this.addGroupMember({
      groupId: group.id,
      userId,
      role: "owner",
    });

    return group;
  }

  async updateGroup(
    id: string,
    userId: string,
    updates: Partial<InsertGroup>
  ): Promise<Group | undefined> {
    const [group] = await db
      .update(groups)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(groups.id, id), eq(groups.ownerId, userId)))
      .returning();

    return group;
  }

  async deleteGroup(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(groups)
      .where(and(eq(groups.id, id), eq(groups.ownerId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ============================================================================
  // GROUP MEMBERSHIP OPERATIONS
  // ============================================================================

  async addGroupMember(
    membership: InsertGroupMembership
  ): Promise<GroupMembership> {
    const [newMember] = await db
      .insert(groupMemberships)
      .values(membership)
      .returning();
    return newMember;
  }

  async removeGroupMember(groupId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(groupMemberships)
      .where(
        and(
          eq(groupMemberships.groupId, groupId),
          eq(groupMemberships.userId, userId)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getGroupMembers(groupId: string): Promise<GroupMembership[]> {
    return await db
      .select()
      .from(groupMemberships)
      .where(eq(groupMemberships.groupId, groupId));
  }

  // ============================================================================
  // SHARE OPERATIONS
  // ============================================================================

  async createShare(shareData: InsertShare): Promise<Share> {
    const shareToken = generateShareToken();

    const [share] = await db
      .insert(shares)
      .values({
        ...shareData,
        shareToken,
      })
      .returning();

    return share;
  }

  async getSharesByLink(linkId: string): Promise<Share[]> {
    return await db.select().from(shares).where(eq(shares.linkId, linkId));
  }

  async getSharesByUser(userId: string): Promise<Share[]> {
    return await db
      .select()
      .from(shares)
      .where(eq(shares.sharedById, userId))
      .orderBy(desc(shares.createdAt));
  }

  // ============================================================================
  // CLICK EVENT OPERATIONS
  // ============================================================================

  async recordClick(eventData: InsertClickEvent): Promise<ClickEvent> {
    const [event] = await db.insert(clickEvents).values(eventData).returning();
    
    // Increment link click count
    await this.incrementLinkClicks(eventData.linkId);
    
    return event;
  }

  async getClicksByLink(linkId: string): Promise<ClickEvent[]> {
    return await db
      .select()
      .from(clickEvents)
      .where(eq(clickEvents.linkId, linkId))
      .orderBy(desc(clickEvents.createdAt));
  }

  // ============================================================================
  // NOTIFICATION OPERATIONS
  // ============================================================================

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(
    notificationData: InsertNotification
  ): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async markNotificationRead(id: string, userId: string): Promise<boolean> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return !!notification;
  }
}

export const storage = new DatabaseStorage();
