import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, companyUsersTable, plansTable, subscriptionsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { AddCompanyUserBody, UpdateCompanyUserBody } from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const rows = await db
    .select({
      id: companyUsersTable.id,
      userId: companyUsersTable.userId,
      companyId: companyUsersTable.companyId,
      role: companyUsersTable.role,
      status: companyUsersTable.status,
      createdAt: companyUsersTable.createdAt,
      name: usersTable.name,
      phone: usersTable.phone,
      email: usersTable.email,
    })
    .from(companyUsersTable)
    .innerJoin(usersTable, eq(companyUsersTable.userId, usersTable.id))
    .where(eq(companyUsersTable.companyId, companyId));
  res.json(rows);
});

router.post("/", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const parsed = AddCompanyUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [sub] = await db
    .select({ planId: subscriptionsTable.planId })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.companyId, companyId))
    .limit(1);

  if (sub) {
    const [plan] = await db
      .select({ maxUsers: plansTable.maxUsers })
      .from(plansTable)
      .where(eq(plansTable.id, sub.planId))
      .limit(1);

    if (plan) {
      const [{ total }] = await db
        .select({ total: count() })
        .from(companyUsersTable)
        .where(eq(companyUsersTable.companyId, companyId));

      if (total >= plan.maxUsers) {
        res.status(422).json({ error: `Limite de ${plan.maxUsers} usuários do plano atingido` });
        return;
      }
    }
  }

  const { name, phone, email, password, role } = parsed.data;

  const existing = (await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.phone, phone)).limit(1))[0];
  if (existing) {
    res.status(409).json({ error: "Já existe um usuário com este número de telefone" });
    return;
  }

  const hash = await bcrypt.hash(password ?? "meuclubedefault", 10);
  const [user] = await db.insert(usersTable).values({ name, phone, email: email ?? null, passwordHash: hash }).returning();

  const [cu] = await db
    .insert(companyUsersTable)
    .values({ userId: user.id, companyId, role: role ?? "member" })
    .onConflictDoUpdate({ target: [companyUsersTable.userId, companyUsersTable.companyId], set: { role: role ?? "member" } })
    .returning();

  res.status(201).json({ ...cu, name: user.name, phone: user.phone, email: user.email ?? null });
});

router.patch("/:userId", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const userId = Number(req.params.userId);
  const parsed = UpdateCompanyUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const updates: Record<string, string> = {};
  if (parsed.data.role) updates.role = parsed.data.role;
  if (parsed.data.status) updates.status = parsed.data.status;

  const [cu] = await db
    .update(companyUsersTable)
    .set(updates)
    .where(and(eq(companyUsersTable.companyId, companyId), eq(companyUsersTable.userId, userId)))
    .returning();
  if (!cu) { res.status(404).json({ error: "Not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json({ ...cu, name: user?.name ?? "", phone: user?.phone ?? "", email: user?.email ?? null });
});

router.delete("/:userId", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const userId = Number(req.params.userId);
  await db.delete(companyUsersTable).where(and(eq(companyUsersTable.companyId, companyId), eq(companyUsersTable.userId, userId)));
  res.status(204).send();
});

router.post("/:userId/reset-password", async (req, res) => {
  const companyId = Number(req.params.companyId);
  const userId = Number(req.params.userId);
  const { newPassword } = req.body as { newPassword: string };

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres" });
    return;
  }

  const [cu] = await db
    .select()
    .from(companyUsersTable)
    .where(and(eq(companyUsersTable.companyId, companyId), eq(companyUsersTable.userId, userId)))
    .limit(1);
  if (!cu) { res.status(404).json({ error: "Usuário não encontrado nesta empresa" }); return; }

  const hash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.id, userId));
  res.json({ ok: true });
});

export default router;
