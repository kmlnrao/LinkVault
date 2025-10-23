import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// AUTHENTICATION & SESSIONS
// ============================================================================

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// ============================================================================
// REFERRAL LINKS
// ============================================================================

export const links = pgTable(
  "links",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ownerId: varchar("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    urlEncrypted: text("url_encrypted").notNull(), // Encrypted referral URL
    institution: varchar("institution", { length: 255 }), // Bank, company name
    category: varchar("category", { length: 100 }).notNull(), // Credit Cards, Bank Accounts, etc.
    notesEncrypted: text("notes_encrypted"), // Encrypted notes
    bonusValue: varchar("bonus_value", { length: 100 }), // e.g., "$200", "50,000 points"
    expiresAt: timestamp("expires_at"),
    visibility: varchar("visibility", { length: 20 }).notNull().default("private"), // private, group, contacts
    isArchived: boolean("is_archived").default(false).notNull(),
    clickCount: integer("click_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("links_owner_idx").on(table.ownerId),
    index("links_category_idx").on(table.category),
    index("links_visibility_idx").on(table.visibility),
  ]
);

export const linksRelations = relations(links, ({ one, many }) => ({
  owner: one(users, {
    fields: [links.ownerId],
    references: [users.id],
  }),
  shares: many(shares),
  clickEvents: many(clickEvents),
}));

export type Link = typeof links.$inferSelect;
export const insertLinkSchema = createInsertSchema(links).omit({
  id: true,
  clickCount: true,
  createdAt: true,
  updatedAt: true,
  isArchived: true,
});
export type InsertLink = z.infer<typeof insertLinkSchema>;

// ============================================================================
// GROUPS
// ============================================================================

export const groups = pgTable(
  "groups",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ownerId: varchar("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: varchar("type", { length: 50 }).notNull().default("friends"), // family, friends, colleagues
    inviteCode: varchar("invite_code", { length: 100 }).unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("groups_owner_idx").on(table.ownerId),
    index("groups_invite_code_idx").on(table.inviteCode),
  ]
);

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(users, {
    fields: [groups.ownerId],
    references: [users.id],
  }),
  memberships: many(groupMemberships),
  shares: many(shares),
}));

export type Group = typeof groups.$inferSelect;
export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  inviteCode: true,
});
export type InsertGroup = z.infer<typeof insertGroupSchema>;

// ============================================================================
// GROUP MEMBERSHIPS
// ============================================================================

export const groupMemberships = pgTable(
  "group_memberships",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    groupId: varchar("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull().default("member"), // owner, admin, member
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    index("memberships_group_idx").on(table.groupId),
    index("memberships_user_idx").on(table.userId),
  ]
);

export const groupMembershipsRelations = relations(groupMemberships, ({ one }) => ({
  group: one(groups, {
    fields: [groupMemberships.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMemberships.userId],
    references: [users.id],
  }),
}));

export type GroupMembership = typeof groupMemberships.$inferSelect;
export const insertGroupMembershipSchema = createInsertSchema(groupMemberships).omit({
  id: true,
  joinedAt: true,
});
export type InsertGroupMembership = z.infer<typeof insertGroupMembershipSchema>;

// ============================================================================
// SHARES (Link Sharing Records)
// ============================================================================

export const shares = pgTable(
  "shares",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    linkId: varchar("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    sharedById: varchar("shared_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: varchar("target_type", { length: 20 }).notNull(), // group, contact
    targetId: varchar("target_id").notNull(), // group ID or contact email
    shareToken: varchar("share_token", { length: 100 }).unique(), // For secure sharing
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("shares_link_idx").on(table.linkId),
    index("shares_shared_by_idx").on(table.sharedById),
    index("shares_target_idx").on(table.targetType, table.targetId),
  ]
);

export const sharesRelations = relations(shares, ({ one }) => ({
  link: one(links, {
    fields: [shares.linkId],
    references: [links.id],
  }),
  sharedBy: one(users, {
    fields: [shares.sharedById],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [shares.targetId],
    references: [groups.id],
  }),
}));

export type Share = typeof shares.$inferSelect;
export const insertShareSchema = createInsertSchema(shares).omit({
  id: true,
  createdAt: true,
  shareToken: true,
});
export type InsertShare = z.infer<typeof insertShareSchema>;

// ============================================================================
// CLICK EVENTS (Analytics)
// ============================================================================

export const clickEvents = pgTable(
  "click_events",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    linkId: varchar("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // Nullable for anonymous clicks
    ipHash: varchar("ip_hash", { length: 64 }), // Hashed IP for privacy
    userAgentHash: varchar("user_agent_hash", { length: 64 }), // Hashed user agent
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("click_events_link_idx").on(table.linkId),
    index("click_events_user_idx").on(table.userId),
    index("click_events_created_idx").on(table.createdAt),
  ]
);

export const clickEventsRelations = relations(clickEvents, ({ one }) => ({
  link: one(links, {
    fields: [clickEvents.linkId],
    references: [links.id],
  }),
  user: one(users, {
    fields: [clickEvents.userId],
    references: [users.id],
  }),
}));

export type ClickEvent = typeof clickEvents.$inferSelect;
export const insertClickEventSchema = createInsertSchema(clickEvents).omit({
  id: true,
  createdAt: true,
});
export type InsertClickEvent = z.infer<typeof insertClickEventSchema>;

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // link_shared, group_invite, link_expiring
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    linkId: varchar("link_id").references(() => links.id, { onDelete: "set null" }),
    groupId: varchar("group_id").references(() => groups.id, { onDelete: "set null" }),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_read_idx").on(table.isRead),
  ]
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  link: one(links, {
    fields: [notifications.linkId],
    references: [links.id],
  }),
  group: one(groups, {
    fields: [notifications.groupId],
    references: [groups.id],
  }),
}));

export type Notification = typeof notifications.$inferSelect;
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// ============================================================================
// PREDEFINED CATEGORIES (for consistency)
// ============================================================================

export const LINK_CATEGORIES = [
  "Credit Cards",
  "Bank Accounts",
  "Subscriptions",
  "Shopping",
  "Travel",
  "Finance",
  "Services",
  "Other",
] as const;

export const GROUP_TYPES = ["family", "friends", "colleagues", "public"] as const;

export const VISIBILITY_OPTIONS = ["private", "group", "contacts"] as const;
