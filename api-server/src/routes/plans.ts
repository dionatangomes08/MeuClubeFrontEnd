import { Router } from "express";
import { db, plansTable, subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreatePlanBody, SetCompanySubscriptionBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const plans = await db.select().from(plansTable).orderBy(plansTable.price);
  res.json(plans);
});

router.post("/", async (req, res) => {
  const parsed = CreatePlanBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [plan] = await db.insert(plansTable).values({ ...parsed.data, price: String(parsed.data.price) }).returning();
  res.status(201).json(plan);
});

export const subscriptionRouter = Router({ mergeParams: true });

subscriptionRouter.get("/", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const [sub] = await db
    .select({
      id: subscriptionsTable.id,
      companyId: subscriptionsTable.companyId,
      planId: subscriptionsTable.planId,
      status: subscriptionsTable.status,
      startDate: subscriptionsTable.startDate,
      nextBillingDate: subscriptionsTable.nextBillingDate,
      planName: plansTable.name,
      planMaxUsers: plansTable.maxUsers,
      planMaxStructures: plansTable.maxStructures,
    })
    .from(subscriptionsTable)
    .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
    .where(eq(subscriptionsTable.companyId, companyId))
    .orderBy(subscriptionsTable.createdAt)
    .limit(1);
  if (!sub) { res.status(404).json({ error: "No subscription" }); return; }
  res.json(sub);
});

subscriptionRouter.post("/", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const parsed = SetCompanySubscriptionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const existing = await db
    .select({ id: subscriptionsTable.id })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.companyId, companyId))
    .limit(1);

  let sub;
  if (existing.length > 0) {
    [sub] = await db
      .update(subscriptionsTable)
      .set({ planId: parsed.data.planId, status: "active", startDate: today, nextBillingDate: nextMonth })
      .where(eq(subscriptionsTable.companyId, companyId))
      .returning();
  } else {
    [sub] = await db
      .insert(subscriptionsTable)
      .values({ companyId, planId: parsed.data.planId, startDate: today, nextBillingDate: nextMonth })
      .returning();
  }

  const [plan] = await db
    .select({ name: plansTable.name, maxUsers: plansTable.maxUsers, maxStructures: plansTable.maxStructures })
    .from(plansTable)
    .where(eq(plansTable.id, parsed.data.planId))
    .limit(1);

  res.json({ ...sub, planName: plan?.name ?? "", planMaxUsers: plan?.maxUsers ?? null, planMaxStructures: plan?.maxStructures ?? null });
});

export default router;
