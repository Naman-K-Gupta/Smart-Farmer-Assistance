import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const usersTable = pgTable("smart_farmer_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  location: text("location").notNull(),
  initials: text("initials").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const farmerProfilesTable = pgTable("smart_farmer_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => usersTable.id),
  mobile: text("mobile").notNull(),
  village: text("village").notNull(),
  district: text("district").notNull(),
  state: text("state").notNull(),
  landArea: numeric("land_area", { precision: 8, scale: 2 }).notNull(),
  crops: text("crops").array().notNull(),
  expectedYield: text("expected_yield").notNull(),
  maskedAccount: text("masked_account").notNull(),
  completion: integer("completion").notNull().default(80),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const procurementCentresTable = pgTable("smart_farmer_centres", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  district: text("district").notNull(),
  distance: text("distance").notNull(),
  open: boolean("open").notNull().default(true),
  queue: integer("queue").notNull().default(0),
  capacity: integer("capacity").notNull(),
  remaining: integer("remaining").notNull(),
  waitMinutes: integer("wait_minutes").notNull(),
  phone: text("phone").notNull(),
  latitude: numeric("latitude", { precision: 9, scale: 6 }).notNull(),
  longitude: numeric("longitude", { precision: 9, scale: 6 }).notNull(),
});

export const centreSlotsTable = pgTable("smart_farmer_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  centreId: uuid("centre_id").notNull().references(() => procurementCentresTable.id),
  slotDate: date("slot_date", { mode: "string" }).notNull(),
  label: text("label").notNull(),
  available: integer("available").notNull(),
  capacity: integer("capacity").notNull(),
  recommended: boolean("recommended").notNull().default(false),
});

export const bookingsTable = pgTable("smart_farmer_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  centreId: uuid("centre_id").notNull().references(() => procurementCentresTable.id),
  slotId: uuid("slot_id").notNull().references(() => centreSlotsTable.id),
  crop: text("crop").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("confirmed"),
  arrival: text("arrival").notNull().default("Slot booked"),
  quality: text("quality").notNull().default("Pending"),
  procurement: text("procurement").notNull().default("Awaiting arrival"),
  payment: text("payment").notNull().default("Not initiated"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentsTable = pgTable("smart_farmer_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookingsTable.id),
  crop: text("crop").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  gross: numeric("gross", { precision: 12, scale: 2 }).notNull(),
  deductions: numeric("deductions", { precision: 12, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  transactionId: text("transaction_id").notNull(),
  paymentDate: date("payment_date", { mode: "string" }).notNull(),
});

export const notificationsTable = pgTable("smart_farmer_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  notificationTime: text("notification_time").notNull(),
  type: text("type").notNull(),
  read: boolean("read").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export const insertFarmerProfileSchema = createInsertSchema(farmerProfilesTable).omit({ id: true, updatedAt: true });
export const insertCentreSchema = createInsertSchema(procurementCentresTable).omit({ id: true });
export const insertSlotSchema = createInsertSchema(centreSlotsTable).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true });
export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertFarmerProfile = z.infer<typeof insertFarmerProfileSchema>;
export type InsertCentre = z.infer<typeof insertCentreSchema>;
export type InsertSlot = z.infer<typeof insertSlotSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;