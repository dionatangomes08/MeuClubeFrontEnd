import { Router } from "express";
import { db, structuresTable, plansTable, subscriptionsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { CreateStructureBody, UpdateStructureBody } from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const structures = await db.select().from(structuresTable).where(eq(structuresTable.companyId, companyId)).orderBy(structuresTable.name);
  res.json(structures);
});

router.post("/", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const parsed = CreateStructureBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [sub] = await db
    .select({ planId: subscriptionsTable.planId })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.companyId, companyId))
    .limit(1);

  if (sub) {
    const [plan] = await db
      .select({ maxStructures: plansTable.maxStructures })
      .from(plansTable)
      .where(eq(plansTable.id, sub.planId))
      .limit(1);

    if (plan) {
      const [{ total }] = await db
        .select({ total: count() })
        .from(structuresTable)
        .where(eq(structuresTable.companyId, companyId));

      if (total >= plan.maxStructures) {
        res.status(422).json({ error: `Limite de ${plan.maxStructures} estruturas do plano atingido` });
        return;
      }
    }
  }

  const [s] = await db.insert(structuresTable).values({ ...parsed.data, companyId }).returning();
  res.status(201).json(s);
});

router.get("/:structureId", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const id = Number(req.params.structureId);
  const [s] = await db.select().from(structuresTable).where(and(eq(structuresTable.id, id), eq(structuresTable.companyId, companyId))).limit(1);
  if (!s) { res.status(404).json({ error: "Not found" }); return; }
  res.json(s);
});

router.patch("/:structureId", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const id = Number(req.params.structureId);
  const parsed = UpdateStructureBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [s] = await db.update(structuresTable).set(parsed.data).where(and(eq(structuresTable.id, id), eq(structuresTable.companyId, companyId))).returning();
  if (!s) { res.status(404).json({ error: "Not found" }); return; }
  res.json(s);
});

router.delete("/:structureId", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const id = Number(req.params.structureId);
  await db.delete(structuresTable).where(and(eq(structuresTable.id, id), eq(structuresTable.companyId, companyId)));
  res.status(204).send();
});

export default router;
