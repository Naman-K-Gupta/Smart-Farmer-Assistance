import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  bookingsTable,
  centreSlotsTable,
  farmerProfilesTable,
  notificationsTable,
  paymentsTable,
  procurementCentresTable,
  usersTable,
} from "@workspace/db";
import {
  CreateBookingBody,
  DemoLoginBody,
  ListBookingsQueryParams,
  MarkNotificationReadParams,
  UpdateBookingBody,
  UpdateBookingParams,
  UpdateProfileBody,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();
let seedPromise: Promise<void> | undefined;

const farmerName = "Harpreet Singh";
const officerName = "Amandeep Kaur";

function numberValue(value: string | number) {
  return typeof value === "number" ? value : Number(value);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
      if (existing.length) return;

      const [farmer] = await db
        .insert(usersTable)
        .values({
          name: farmerName,
          role: "farmer",
          location: "Ludhiana, Punjab",
          initials: "HS",
        })
        .returning();
      const [officer] = await db
        .insert(usersTable)
        .values({
          name: officerName,
          role: "officer",
          location: "Phagwara, Punjab",
          initials: "AK",
        })
        .returning();
      await db.insert(usersTable).values({
        name: "Meera Sharma",
        role: "admin",
        location: "Chandigarh, Punjab",
        initials: "MS",
      });
      await db.insert(farmerProfilesTable).values({
        userId: farmer.id,
        mobile: "+91 98765 43210",
        village: "Bassi Pathana",
        district: "Fatehgarh Sahib",
        state: "Punjab",
        landArea: "18.5",
        crops: ["Wheat", "Paddy"],
        expectedYield: "126 quintals",
        maskedAccount: "•••• 4821",
        completion: 84,
      });

      const centres = await db
        .insert(procurementCentresTable)
        .values([
          {
            name: "Government Procurement Centre",
            address: "GT Road, Phagwara",
            district: "Kapurthala",
            distance: "8.4 km",
            queue: 24,
            capacity: 300,
            remaining: 176,
            waitMinutes: 25,
            phone: "+91 1800 180 2211",
            latitude: "31.2240",
            longitude: "75.7708",
          },
          {
            name: "Mandi Board Collection Yard",
            address: "New Grain Market, Ludhiana",
            district: "Ludhiana",
            distance: "16.2 km",
            queue: 41,
            capacity: 420,
            remaining: 98,
            waitMinutes: 42,
            phone: "+91 161 245 8820",
            latitude: "30.9010",
            longitude: "75.8573",
          },
          {
            name: "Kisan Seva Procurement Hub",
            address: "Chandigarh Road, Samrala",
            district: "Ludhiana",
            distance: "22.8 km",
            queue: 9,
            capacity: 180,
            remaining: 112,
            waitMinutes: 12,
            phone: "+91 1800 180 3344",
            latitude: "30.7110",
            longitude: "76.1500",
          },
        ])
        .returning();

      const slots = await db
        .insert(centreSlotsTable)
        .values(
          centres.flatMap((centre, centreIndex) => [
            {
              centreId: centre.id,
              slotDate: "2026-09-12",
              label: "09:00 AM – 09:30 AM",
              available: centreIndex === 1 ? 0 : 12,
              capacity: 20,
              recommended: false,
            },
            {
              centreId: centre.id,
              slotDate: "2026-09-12",
              label: "10:30 AM – 11:00 AM",
              available: centreIndex === 1 ? 6 : 18,
              capacity: 20,
              recommended: centreIndex === 0,
            },
            {
              centreId: centre.id,
              slotDate: "2026-09-13",
              label: "11:00 AM – 11:30 AM",
              available: 20,
              capacity: 20,
              recommended: false,
            },
          ]),
        )
        .returning();

      const bookingSlot = slots.find((slot) => slot.recommended) ?? slots[0];
      const [booking] = await db
        .insert(bookingsTable)
        .values({
          userId: farmer.id,
          centreId: bookingSlot.centreId,
          slotId: bookingSlot.id,
          crop: "Wheat",
          quantity: "42",
          status: "confirmed",
          arrival: "Slot confirmed",
          quality: "Pending",
          procurement: "Awaiting arrival",
          payment: "Not initiated",
        })
        .returning();
      await db.insert(paymentsTable).values([
        {
          bookingId: booking.id,
          crop: "Paddy",
          quantity: "36",
          pricePerUnit: "2320",
          gross: "83520",
          deductions: "1252.8",
          amount: "82267.2",
          status: "completed",
          transactionId: "DEMO-TXN-240812",
          paymentDate: "2026-08-12",
        },
        {
          bookingId: booking.id,
          crop: "Wheat",
          quantity: "42",
          pricePerUnit: "2275",
          gross: "95550",
          deductions: "1433.25",
          amount: "94116.75",
          status: "processing",
          transactionId: "DEMO-TXN-240901",
          paymentDate: "2026-09-01",
        },
      ]);
      await db.insert(notificationsTable).values([
        {
          userId: farmer.id,
          title: "Slot confirmed",
          message: "Your wheat procurement slot is confirmed for 12 September at 10:30 AM.",
          notificationTime: "12 min ago",
          type: "booking",
          read: false,
        },
        {
          userId: farmer.id,
          title: "Payment processing",
          message: "Your wheat payment of ₹94,116.75 is being processed.",
          notificationTime: "2 hours ago",
          type: "payment",
          read: false,
        },
        {
          userId: farmer.id,
          title: "Centre update",
          message: "Phagwara centre has a 25 minute estimated wait today.",
          notificationTime: "Yesterday",
          type: "centre",
          read: true,
        },
      ]);
      // Touch the officer so the seeded role is guaranteed to exist in small demos.
      if (!officer.id) throw new Error("Officer seed failed");
    })().catch((error) => {
      seedPromise = undefined;
      logger.error({ err: error }, "Unable to seed Smart Farmer demo data");
      throw error;
    });
  }
  return seedPromise;
}

async function userForRole(role: string) {
  await ensureSeeded();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.role, role)).limit(1);
  return user;
}

async function centreForId(id: string) {
  const [centre] = await db.select().from(procurementCentresTable).where(eq(procurementCentresTable.id, id)).limit(1);
  return centre;
}

async function mapCentre(centre: typeof procurementCentresTable.$inferSelect) {
  return {
    id: centre.id,
    name: centre.name,
    address: centre.address,
    district: centre.district,
    distance: centre.distance,
    open: centre.open,
    queue: centre.queue,
    capacity: centre.capacity,
    remaining: centre.remaining,
    waitMinutes: centre.waitMinutes,
    phone: centre.phone,
    coordinates: { lat: numberValue(centre.latitude), lng: numberValue(centre.longitude) },
  };
}

async function mapBooking(booking: typeof bookingsTable.$inferSelect) {
  const centre = await centreForId(booking.centreId);
  const slot = await db.select().from(centreSlotsTable).where(eq(centreSlotsTable.id, booking.slotId)).limit(1);
  if (!centre || !slot[0]) throw new Error("Booking references missing centre or slot");
  return {
    id: booking.id,
    crop: booking.crop,
    quantity: numberValue(booking.quantity),
    centre: await mapCentre(centre),
    date: slot[0].slotDate,
    time: slot[0].label,
    status: booking.status,
    arrival: booking.arrival,
    quality: booking.quality,
    procurement: booking.procurement,
    payment: booking.payment,
  };
}

async function allBookings(userId: string) {
  const rows = await db.select().from(bookingsTable).where(eq(bookingsTable.userId, userId)).orderBy(desc(bookingsTable.createdAt));
  return Promise.all(rows.map(mapBooking));
}

router.post("/auth/demo-login", async (req: Request, res: Response) => {
  const parsed = DemoLoginBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Choose a valid demo role." });
  const user = await userForRole(parsed.data.role);
  if (!user) return res.status(404).json({ error: "Demo role unavailable." });
  return res.json({
    user: { id: user.id, name: user.name, role: user.role, location: user.location, initials: user.initials },
    token: `demo-${user.role}-${user.id}`,
  });
});

router.get("/dashboard", async (_req, res) => {
  const user = await userForRole("farmer");
  if (!user) return res.status(404).json({ error: "Farmer profile unavailable." });
  const [profile] = await db.select().from(farmerProfilesTable).where(eq(farmerProfilesTable.userId, user.id)).limit(1);
  const [centres, bookings, payments, notifications] = await Promise.all([
    db.select().from(procurementCentresTable),
    allBookings(user.id),
    db.select().from(paymentsTable),
    db.select().from(notificationsTable).where(eq(notificationsTable.userId, user.id)),
  ]);
  const activeBookings = bookings.filter((booking) => !["cancelled", "completed"].includes(booking.status));
  return res.json({
    user: { id: user.id, name: user.name, role: user.role, location: user.location, initials: user.initials },
    stats: {
      totalLand: numberValue(profile?.landArea ?? "0"),
      currentCrop: profile?.crops?.[0] ?? "Wheat",
      expectedQuantity: profile?.expectedYield ?? "0 quintals",
      bookedSlots: activeBookings.length,
      completedProcurements: bookings.filter((booking) => booking.status === "completed").length,
      pendingPayments: payments.filter((payment) => payment.status !== "completed").length,
    },
    upcomingBooking: activeBookings[0] ?? null,
    notifications: notifications.slice(0, 5).map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      time: notification.notificationTime,
      type: notification.type,
      read: notification.read,
    })),
    centres: await Promise.all(centres.map(mapCentre)),
  });
});

router.get("/profile", async (_req, res) => {
  const user = await userForRole("farmer");
  const [profile] = user
    ? await db.select().from(farmerProfilesTable).where(eq(farmerProfilesTable.userId, user.id)).limit(1)
    : [];
  if (!user || !profile) return res.status(404).json({ error: "Profile unavailable." });
  return res.json({
    id: profile.id,
    name: user.name,
    mobile: profile.mobile,
    village: profile.village,
    district: profile.district,
    state: profile.state,
    landArea: numberValue(profile.landArea),
    crops: profile.crops,
    expectedYield: profile.expectedYield,
    maskedAccount: profile.maskedAccount,
    completion: profile.completion,
  });
});

router.patch("/profile", async (req, res) => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the profile details." });
  const user = await userForRole("farmer");
  if (!user) return res.status(404).json({ error: "Profile unavailable." });
  const [profile] = await db.select().from(farmerProfilesTable).where(eq(farmerProfilesTable.userId, user.id)).limit(1);
  if (!profile) return res.status(404).json({ error: "Profile unavailable." });
  const [updated] = await db.update(farmerProfilesTable).set({
    village: parsed.data.village ?? profile.village,
    district: parsed.data.district ?? profile.district,
    state: parsed.data.state ?? profile.state,
    landArea: parsed.data.landArea?.toString() ?? profile.landArea,
    crops: parsed.data.crops ?? profile.crops,
    expectedYield: parsed.data.expectedYield ?? profile.expectedYield,
    completion: 100,
    updatedAt: new Date(),
  }).where(eq(farmerProfilesTable.id, profile.id)).returning();
  if (parsed.data.name) await db.update(usersTable).set({ name: parsed.data.name, initials: initials(parsed.data.name) }).where(eq(usersTable.id, user.id));
  return res.json({
    id: updated.id,
    name: parsed.data.name ?? user.name,
    mobile: updated.mobile,
    village: updated.village,
    district: updated.district,
    state: updated.state,
    landArea: numberValue(updated.landArea),
    crops: updated.crops,
    expectedYield: updated.expectedYield,
    maskedAccount: updated.maskedAccount,
    completion: updated.completion,
  });
});

router.get("/centres", async (_req, res) => {
  await ensureSeeded();
  const centres = await db.select().from(procurementCentresTable);
  return res.json(await Promise.all(centres.map(mapCentre)));
});

router.get("/centres/:centreId/slots", async (req, res) => {
  await ensureSeeded();
  const params = { centreId: req.params.centreId };
  const slots = await db.select().from(centreSlotsTable).where(eq(centreSlotsTable.centreId, params.centreId));
  return res.json(slots.map((slot) => ({
    id: slot.id,
    date: slot.slotDate,
    label: slot.label,
    available: slot.available,
    capacity: slot.capacity,
    recommended: slot.recommended,
  })));
});

router.get("/bookings", async (req, res) => {
  const parsed = ListBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid booking filters." });
  const user = await userForRole("farmer");
  if (!user) return res.status(404).json({ error: "Farmer unavailable." });
  let bookings = await allBookings(user.id);
  if (parsed.data.status && parsed.data.status !== "all") {
    const status = parsed.data.status;
    bookings = bookings.filter((booking) => status === "upcoming"
      ? ["pending", "confirmed", "approaching"].includes(booking.status)
      : status === "completed" ? booking.status === "completed"
        : status === "cancelled" ? booking.status === "cancelled"
          : booking.status === "pending");
  }
  if (parsed.data.search) {
    const search = parsed.data.search.toLowerCase();
    bookings = bookings.filter((booking) => `${booking.id} ${booking.crop} ${booking.centre.name}`.toLowerCase().includes(search));
  }
  return res.json(bookings);
});

router.post("/bookings", async (req, res) => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Select a crop, centre, and available slot." });
  const user = await userForRole("farmer");
  if (!user) return res.status(404).json({ error: "Farmer unavailable." });
  try {
    const created = await db.transaction(async (tx) => {
      const [slot] = await tx.select().from(centreSlotsTable).where(eq(centreSlotsTable.id, parsed.data.slotId)).limit(1);
      if (!slot || slot.centreId !== parsed.data.centreId || slot.available <= 0) {
        throw new Error("SLOT_FULL");
      }
      const existing = await tx.select().from(bookingsTable).where(and(
        eq(bookingsTable.userId, user.id),
        eq(bookingsTable.slotId, slot.id),
        ne(bookingsTable.status, "cancelled"),
      )).limit(1);
      if (existing.length) throw new Error("DUPLICATE");
      await tx.update(centreSlotsTable).set({ available: slot.available - 1 }).where(eq(centreSlotsTable.id, slot.id));
      const [booking] = await tx.insert(bookingsTable).values({
        userId: user.id,
        centreId: parsed.data.centreId,
        slotId: parsed.data.slotId,
        crop: parsed.data.crop,
        quantity: parsed.data.quantity.toString(),
        status: "confirmed",
        arrival: "Slot confirmed",
        quality: "Pending",
        procurement: "Awaiting arrival",
        payment: "Not initiated",
      }).returning();
      return booking;
    });
    const booking = await mapBooking(created);
    await db.insert(notificationsTable).values({
      userId: user.id,
      title: "Slot confirmed",
      message: `Your ${booking.crop.toLowerCase()} slot at ${booking.centre.name} is confirmed.`,
      notificationTime: "Just now",
      type: "booking",
      read: false,
    });
    return res.status(201).json(booking);
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_FULL") return res.status(409).json({ error: "This slot is full. Choose another time." });
    if (error instanceof Error && error.message === "DUPLICATE") return res.status(409).json({ error: "You already have a booking for this slot." });
    req.log.error({ err: error }, "Unable to create booking");
    return res.status(500).json({ error: "We could not create the booking. Please try again." });
  }
});

router.get("/bookings/:bookingId", async (req, res) => {
  await ensureSeeded();
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, req.params.bookingId)).limit(1);
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  return res.json(await mapBooking(booking));
});

router.patch("/bookings/:bookingId", async (req, res) => {
  const params = UpdateBookingParams.safeParse(req.params);
  const body = UpdateBookingBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid booking update." });
  await ensureSeeded();
  const [updated] = await db.update(bookingsTable).set({ status: body.data.status }).where(eq(bookingsTable.id, params.data.bookingId)).returning();
  if (!updated) return res.status(404).json({ error: "Booking not found." });
  return res.json(await mapBooking(updated));
});

router.delete("/bookings/:bookingId", async (req, res) => {
  await ensureSeeded();
  const [booking] = await db.update(bookingsTable).set({ status: "cancelled" }).where(eq(bookingsTable.id, req.params.bookingId)).returning();
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  const [slot] = await db.select().from(centreSlotsTable).where(eq(centreSlotsTable.id, booking.slotId)).limit(1);
  if (slot) await db.update(centreSlotsTable).set({ available: slot.available + 1 }).where(eq(centreSlotsTable.id, slot.id));
  return res.json(await mapBooking(booking));
});

router.get("/payments", async (_req, res) => {
  await ensureSeeded();
  const payments = await db.select().from(paymentsTable).orderBy(desc(paymentsTable.paymentDate));
  return res.json(payments.map((payment) => ({
    id: payment.id,
    bookingId: payment.bookingId,
    crop: payment.crop,
    quantity: numberValue(payment.quantity),
    pricePerUnit: numberValue(payment.pricePerUnit),
    gross: numberValue(payment.gross),
    deductions: numberValue(payment.deductions),
    amount: numberValue(payment.amount),
    status: payment.status,
    transactionId: payment.transactionId,
    date: payment.paymentDate,
  })));
});

router.get("/notifications", async (_req, res) => {
  const user = await userForRole("farmer");
  if (!user) return res.status(404).json({ error: "Farmer unavailable." });
  const notifications = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, user.id));
  return res.json(notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    time: notification.notificationTime,
    type: notification.type,
    read: notification.read,
  })));
});

router.patch("/notifications/:notificationId/read", async (req, res) => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid notification." });
  await ensureSeeded();
  const [notification] = await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, params.data.notificationId)).returning();
  if (!notification) return res.status(404).json({ error: "Notification not found." });
  return res.json({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    time: notification.notificationTime,
    type: notification.type,
    read: notification.read,
  });
});

router.get("/officer/dashboard", async (_req, res) => {
  const officer = await userForRole("officer");
  if (!officer) return res.status(404).json({ error: "Officer unavailable." });
  const [centre] = await db.select().from(procurementCentresTable).limit(1);
  const [bookings, payments] = await Promise.all([
    db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt)),
    db.select().from(paymentsTable),
  ]);
  if (!centre) return res.status(404).json({ error: "Centre unavailable." });
  return res.json({
    centre: await mapCentre(centre),
    todayBookings: bookings.length + 16,
    currentQueue: centre.queue,
    expectedArrivals: bookings.length + 9,
    completed: 38,
    pendingQuality: bookings.filter((booking) => booking.quality === "Pending").length + 7,
    pendingPayments: payments.filter((payment) => payment.status !== "completed").length + 12,
    queue: await Promise.all(bookings.slice(0, 6).map(mapBooking)),
  });
});

router.get("/admin/dashboard", async (_req, res) => {
  await ensureSeeded();
  const [farmers, centres, bookings, payments] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.role, "farmer")),
    db.select().from(procurementCentresTable),
    db.select().from(bookingsTable),
    db.select().from(paymentsTable),
  ]);
  return res.json({
    totalFarmers: farmers.length + 248,
    totalCentres: centres.length + 4,
    todayBookings: bookings.length + 76,
    todayProcurement: 58,
    pendingPayments: payments.filter((payment) => payment.status !== "completed").length + 23,
    totalQuantity: 18420 + bookings.reduce((sum, booking) => sum + numberValue(booking.quantity), 0),
    bookingTrend: [
      { day: "Mon", bookings: 42 },
      { day: "Tue", bookings: 58 },
      { day: "Wed", bookings: 51 },
      { day: "Thu", bookings: 74 },
      { day: "Fri", bookings: 68 },
      { day: "Sat", bookings: 83 },
      { day: "Sun", bookings: bookings.length + 76 },
    ],
    cropMix: [
      { crop: "Wheat", quantity: 9200 },
      { crop: "Paddy", quantity: 6840 },
      { crop: "Maize", quantity: 2380 },
    ],
  });
});

export default router;