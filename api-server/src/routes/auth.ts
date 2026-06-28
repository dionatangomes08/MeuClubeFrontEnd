import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, companyUsersTable, companiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody, ChangePasswordBody } from "@workspace/api-zod";

declare module "express-session" {
  interface SessionData {
    userId: number;
    companyId: number | null;
  }
}

const router = Router();

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { phone, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  let companyId: number | null = null;
  if (user.role !== "super_admin") {
    const [cu] = await db
      .select()
      .from(companyUsersTable)
      .where(eq(companyUsersTable.userId, user.id))
      .limit(1);
    companyId = cu?.companyId ?? null;

    if (companyId) {
      const [company] = await db
        .select({ status: companiesTable.status })
        .from(companiesTable)
        .where(eq(companiesTable.id, companyId))
        .limit(1);
      if (company && (company.status === "suspended" || company.status === "cancelled")) {
        res.status(403).json({ error: "Entre em contato com a Administração" });
        return;
      }
    }
  }

  req.session.userId = user.id;
  req.session.companyId = companyId;

  res.json({
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    companyId,
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {});
  res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let companyId: number | null = req.session.companyId ?? null;
  let companyRole: string | null = null;

  if (user.role !== "super_admin" && companyId) {
    const [cu] = await db
      .select()
      .from(companyUsersTable)
      .where(eq(companyUsersTable.userId, user.id))
      .limit(1);
    companyId = cu?.companyId ?? null;
    companyRole = cu?.role ?? null;
  }

  res.json({
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email ?? null,
    role: user.role,
    companyId,
    companyRole,
  });
});

router.patch("/password", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Senha atual incorreta" });
    return;
  }

  if (parsed.data.newPassword.length < 6) {
    res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres" });
    return;
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.id, user.id));

  res.json({ ok: true });
});

export default router;
