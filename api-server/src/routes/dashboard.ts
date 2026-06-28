import { Router } from "express";
import { db, companyUsersTable, structuresTable, reservationsTable, usersTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

const router = Router({ mergeParams: true });

async function getRequesterRole(userId: number, companyId: number): Promise<string | null> {
  const [cu] = await db.select({ role: companyUsersTable.role }).from(companyUsersTable)
    .where(and(eq(companyUsersTable.userId, userId), eq(companyUsersTable.companyId, companyId))).limit(1);
  return cu?.role ?? null;
}

router.get("/", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const sessionUserId = (req as any).session?.userId as number | undefined;

  const role = sessionUserId ? await getRequesterRole(sessionUserId, companyId) : null;
  const isMember = role === "member";

  const [{ totalUsers }] = await db
    .select({ totalUsers: sql<number>`count(*)::int` })
    .from(companyUsersTable)
    .where(eq(companyUsersTable.companyId, companyId));

  const [{ totalStructures }] = await db
    .select({ totalStructures: sql<number>`count(*)::int` })
    .from(structuresTable)
    .where(eq(structuresTable.companyId, companyId));

  const [{ activeStructures }] = await db
    .select({ activeStructures: sql<number>`count(*)::int` })
    .from(structuresTable)
    .where(and(eq(structuresTable.companyId, companyId), eq(structuresTable.status, "active")));

  const [{ totalReservations }] = await db
    .select({ totalReservations: sql<number>`count(*)::int` })
    .from(reservationsTable)
    .where(
      isMember
        ? and(eq(reservationsTable.companyId, companyId), eq(reservationsTable.userId, sessionUserId!))
        : eq(reservationsTable.companyId, companyId)
    );

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [{ reservationsThisWeek }] = await db
    .select({ reservationsThisWeek: sql<number>`count(*)::int` })
    .from(reservationsTable)
    .where(
      and(
        isMember
          ? and(eq(reservationsTable.companyId, companyId), eq(reservationsTable.userId, sessionUserId!))
          : eq(reservationsTable.companyId, companyId),
        gte(reservationsTable.date, weekStart.toISOString().split("T")[0]),
        lte(reservationsTable.date, weekEnd.toISOString().split("T")[0]),
      )
    );

  const statusCounts = await db
    .select({
      status: reservationsTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(reservationsTable)
    .where(
      isMember
        ? and(eq(reservationsTable.companyId, companyId), eq(reservationsTable.userId, sessionUserId!))
        : eq(reservationsTable.companyId, companyId)
    )
    .groupBy(reservationsTable.status);

  const todayStr = now.toISOString().split("T")[0];
  const upcomingRows = await db
    .select({
      id: reservationsTable.id,
      companyId: reservationsTable.companyId,
      structureId: reservationsTable.structureId,
      userId: reservationsTable.userId,
      date: reservationsTable.date,
      startTime: reservationsTable.startTime,
      endTime: reservationsTable.endTime,
      status: reservationsTable.status,
      notes: reservationsTable.notes,
      createdAt: reservationsTable.createdAt,
      updatedAt: reservationsTable.updatedAt,
      structureName: structuresTable.name,
      userName: usersTable.name,
    })
    .from(reservationsTable)
    .leftJoin(structuresTable, eq(structuresTable.id, reservationsTable.structureId))
    .leftJoin(usersTable, eq(usersTable.id, reservationsTable.userId))
    .where(
      and(
        isMember
          ? and(eq(reservationsTable.companyId, companyId), eq(reservationsTable.userId, sessionUserId!))
          : eq(reservationsTable.companyId, companyId),
        gte(reservationsTable.date, todayStr),
      )
    )
    .orderBy(reservationsTable.date, reservationsTable.startTime)
    .limit(5);

  res.json({
    totalUsers,
    totalStructures,
    totalReservations,
    reservationsByStatus: statusCounts,
    upcomingReservations: upcomingRows.map(r => ({
      ...r,
      structureName: r.structureName ?? "",
      userName: r.userName ?? "",
    })),
    reservationsThisWeek,
    activeStructures,
  });
});

export default router;
