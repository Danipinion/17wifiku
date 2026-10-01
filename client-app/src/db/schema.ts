import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  decimal,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "isolated",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "unpaid",
  "paid",
  "pending",
]);
export const referralStatusEnum = pgEnum("referral_status", [
  "pending",
  "completed",
]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  customerId: varchar("customer_id", { length: 50 }).unique(), // PPPoE ID
  referralCode: varchar("referral_code", { length: 10 }).unique().notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  points: integer("points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Packages
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bandwidth: text("bandwidth").notNull(), // e.g. "50 Mbps"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  packageId: integer("package_id")
    .references(() => packages.id)
    .notNull(),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  dueDate: timestamp("due_date").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum("status").default("unpaid").notNull(),
  paymentMethod: text("payment_method"),
  proofImageUrl: text("proof_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Referrals
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id")
    .references(() => users.id)
    .notNull(),
  refereeId: integer("referee_id")
    .references(() => users.id)
    .notNull(),
  status: referralStatusEnum("status").default("pending").notNull(),
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tickets
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: ticketStatusEnum("status").default("open").notNull(),
  priority: ticketPriorityEnum("priority").default("medium").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  invoices: many(invoices),
  tickets: many(tickets),
  referralsSent: many(referrals, { relationName: "referrer" }),
  referralsReceived: many(referrals, { relationName: "referee" }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  package: one(packages, {
    fields: [subscriptions.packageId],
    references: [packages.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  referee: one(users, {
    fields: [referrals.refereeId],
    references: [users.id],
    relationName: "referee",
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
}));
