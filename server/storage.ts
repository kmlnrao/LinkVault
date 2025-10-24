import {
  users,
  links,
  groups,
  groupMemberships,
  shares,
  clickEvents,
  notifications,
  authAccounts,
  loginAuditLogs,
  contacts,
  passwordResetTokens,
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
  type AuthAccount,
  type InsertAuthAccount,
  type LoginAuditLog,
  type InsertLoginAuditLog,
  type Contact,
  type InsertContact,
  type PasswordResetToken,
  type InsertPasswordResetToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { encrypt, decrypt, generateInviteCode, generateShareToken } from "./lib/encryption";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Auth account operations (OAuth providers)
  createAuthAccount(authAccount: InsertAuthAccount): Promise<AuthAccount>;
  getAuthAccountsByUser(userId: string): Promise<AuthAccount[]>;
  getAuthAccountByProvider(provider: string, providerAccountId: string): Promise<AuthAccount | undefined>;
  updateAuthAccount(id: string, updates: Partial<InsertAuthAccount>): Promise<AuthAccount | undefined>;

  // Audit log operations
  createAuditLog(log: InsertLoginAuditLog): Promise<LoginAuditLog>;
  getAuditLogs(userId: string, limit?: number): Promise<LoginAuditLog[]>;

  // Password reset token operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<boolean>;
  deleteExpiredTokens(): Promise<void>;

  // Contact operations
  createContact(userId: string, contact: InsertContact): Promise<Contact>;
  getContacts(userId: string, source?: string): Promise<Contact[]>;
  updateContact(id: string, userId: string, updates: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string, userId: string): Promise<boolean>;

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
  createShare(sharedById: string, share: InsertShare): Promise<Share>;
  getSharesByLink(linkId: string): Promise<Share[]>;
  getSharesByUser(userId: string): Promise<Share[]>;

  // Click event operations
  recordClick(event: InsertClickEvent): Promise<ClickEvent>;
  getClicksByLink(linkId: string): Promise<ClickEvent[]>;

  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(userId: string, notification: InsertNotification): Promise<Notification>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // ============================================================================
  // AUTH ACCOUNT OPERATIONS
  // ============================================================================

  async createAuthAccount(authAccountData: InsertAuthAccount): Promise<AuthAccount> {
    const [authAccount] = await db
      .insert(authAccounts)
      .values(authAccountData)
      .returning();
    return authAccount;
  }

  async getAuthAccountsByUser(userId: string): Promise<AuthAccount[]> {
    return await db
      .select()
      .from(authAccounts)
      .where(eq(authAccounts.userId, userId))
      .orderBy(desc(authAccounts.createdAt));
  }

  async getAuthAccountByProvider(
    provider: string,
    providerAccountId: string
  ): Promise<AuthAccount | undefined> {
    const [authAccount] = await db
      .select()
      .from(authAccounts)
      .where(
        and(
          eq(authAccounts.provider, provider),
          eq(authAccounts.providerAccountId, providerAccountId)
        )
      );
    return authAccount;
  }

  async updateAuthAccount(
    id: string,
    updates: Partial<InsertAuthAccount>
  ): Promise<AuthAccount | undefined> {
    const [authAccount] = await db
      .update(authAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(authAccounts.id, id))
      .returning();
    return authAccount;
  }

  // ============================================================================
  // AUDIT LOG OPERATIONS
  // ============================================================================

  async createAuditLog(logData: InsertLoginAuditLog): Promise<LoginAuditLog> {
    const [log] = await db.insert(loginAuditLogs).values(logData).returning();
    return log;
  }

  async getAuditLogs(userId: string, limit: number = 100): Promise<LoginAuditLog[]> {
    return await db
      .select()
      .from(loginAuditLogs)
      .where(eq(loginAuditLogs.userId, userId))
      .orderBy(desc(loginAuditLogs.createdAt))
      .limit(limit);
  }

  // ============================================================================
  // PASSWORD RESET TOKEN OPERATIONS
  // ============================================================================

  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens).values(tokenData).returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markTokenAsUsed(token: string): Promise<boolean> {
    const result = await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteExpiredTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(sql`${passwordResetTokens.expiresAt} < NOW()`);
  }

  // ============================================================================
  // CONTACT OPERATIONS
  // ============================================================================

  async createContact(userId: string, contactData: InsertContact): Promise<Contact> {
    const [contact] = await db.insert(contacts).values({ ...contactData, userId }).returning();
    return contact;
  }

  async getContacts(userId: string, source?: string): Promise<Contact[]> {
    if (source) {
      return await db
        .select()
        .from(contacts)
        .where(and(eq(contacts.userId, userId), eq(contacts.source, source)))
        .orderBy(desc(contacts.createdAt));
    }

    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(desc(contacts.createdAt));
  }

  async updateContact(
    id: string,
    userId: string,
    updates: Partial<InsertContact>
  ): Promise<Contact | undefined> {
    const [contact] = await db
      .update(contacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
      .returning();
    return contact;
  }

  async deleteContact(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
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

  async getGroups(userId: string): Promise<(Group & { memberCount: number; linkCount: number })[]> {
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

    // Get member and link counts for each group
    const groupsWithCounts = await Promise.all(
      uniqueGroups.map(async (group) => {
        const members = await this.getGroupMembers(group.id);
        const groupShares = await this.getSharesByGroup(group.id);
        return {
          ...group,
          memberCount: members.length,
          linkCount: groupShares.length,
        };
      })
    );

    return groupsWithCounts;
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

  async createShare(sharedById: string, shareData: InsertShare): Promise<Share> {
    const shareToken = generateShareToken();

    const [share] = await db
      .insert(shares)
      .values({
        ...shareData,
        sharedById,
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

  async getSharesByGroup(groupId: string): Promise<Share[]> {
    return await db
      .select()
      .from(shares)
      .where(and(eq(shares.targetType, "group"), eq(shares.targetId, groupId)))
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
    userId: string,
    notificationData: InsertNotification
  ): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({ ...notificationData, userId })
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
