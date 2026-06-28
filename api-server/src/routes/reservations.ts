import { Router } from "express";
import { db, reservationsTable, structuresTable, usersTable, companyUsersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateReservationBody, UpdateReservationStatusBody } from "@workspace/api-zod";

const router = Router({ mergeParams: true });

async function enrichReservation(r: typeof reservationsTable.$inferSelect) {
  const [structure] = await db.select({ name: structuresTable.name }).from(structuresTable).where(eq(structuresTable.id, r.structureId)).limit(1);
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, r.userId)).limit(1);
  return {
    ...r,
    structureName: structure?.name ?? "",
    userName: user?.name ?? "",
  };
}

async function getRequesterRole(userId: number, companyId: number): Promise<string | null> {
  const [cu] = await db.select({ role: companyUsersTable.role }).from(companyUsersTable)
    .where(and(eq(companyUsersTable.userId, userId), eq(companyUsersTable.companyId, companyId))).limit(1);
  return cu?.role ?? null;
}

router.get("/", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const userId = (req as any).session?.userId;

  const role = userId ? await getRequesterRole(userId, companyId) : null;

  const filter = role === "member"
    ? and(eq(reservationsTable.companyId, companyId), eq(reservationsTable.userId, userId))
    : eq(reservationsTable.companyId, companyId);

  const rows = await db.select().from(reservationsTable).where(filter).orderBy(reservationsTable.date);
  const enriched = await Promise.all(rows.map(enrichReservation));
  res.json(enriched);
});

router.post("/", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const userId = (req as any).session?.userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const parsed = CreateReservationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const { structureId, date, startTime, endTime, notes } = parsed.data;

  const conflicts = await db
    .select()
    .from(reservationsTable)
    .where(
      and(
        eq(reservationsTable.structureId, structureId),
        eq(reservationsTable.date, date),
      )
    );

  const hasConflict = conflicts.some(c => {
    if (c.status === "cancelled" || c.status === "rejected") return false;
    return c.startTime < endTime && c.endTime > startTime;
  });

  if (hasConflict) { res.status(409).json({ error: "Horário já reservado" }); return; }

  const [r] = await db.insert(reservationsTable).values({
    companyId,
    structureId,
    userId,
    date,
    startTime,
    endTime,
    notes: notes ?? null,
    status: "requested",
  }).returning();

  res.status(201).json(await enrichReservation(r));
});

router.get("/:reservationId", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const id = Number(req.params.reservationId);
  const [r] = await db.select().from(reservationsTable).where(and(eq(reservationsTable.id, id), eq(reservationsTable.companyId, companyId))).limit(1);
  if (!r) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichReservation(r));
});

router.patch("/:reservationId/status", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const id = Number(req.params.reservationId);
  const userId = (req as any).session?.userId;

  const parsed = UpdateReservationStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const role = userId ? await getRequesterRole(userId, companyId) : null;

  if (role === "member") {
    if (parsed.data.status !== "cancelled") {
      res.status(403).json({ error: "Membros só podem cancelar suas próprias reservas" });
      return;
    }
    const [existing] = await db.select().from(reservationsTable)
      .where(and(eq(reservationsTable.id, id), eq(reservationsTable.companyId, companyId))).limit(1);
    if (!existing || existing.userId !== userId) {
      res.status(403).json({ error: "Você só pode cancelar suas próprias reservas" });
      return;
    }
  }

  const [r] = await db.update(reservationsTable).set({ status: parsed.data.status }).where(and(eq(reservationsTable.id, id), eq(reservationsTable.companyId, companyId))).returning();
  if (!r) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichReservation(r));
});

export default router;
