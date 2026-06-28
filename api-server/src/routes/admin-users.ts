import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function requireSuperAdmin(req: any, res: any): Promise<boolean> {
  if (!req.session.userId) {
    res.status(401).json({ error: "Não autenticado" });
    return false;
  }
  const [user] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user || user.role !== "super_admin") {
    res.status(403).json({ error: "Acesso negado" });
    return false;
  }
  return true;
}

router.get("/", async (req, res) => {
  if (!await requireSuperAdmin(req, res)) return;

  const users = await db
    .select({ id: usersTable.id, name: usersTable.name, phone: usersTable.phone, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(usersTable)
    .where(eq(usersTable.role, "super_admin"))
    .orderBy(usersTable.createdAt);

  res.json(users);
});

router.post("/", async (req, res) => {
  if (!await requireSuperAdmin(req, res)) return;

  const { name, phone, email, password } = req.body as { name?: string; phone?: string; email?: string; password?: string };
  if (!name || !phone || !password || password.length < 6) {
    res.status(400).json({ error: "Dados inválidos: nome, telefone e senha (mín. 6 caracteres) são obrigatórios" });
    return;
  }

  const existing = (await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.phone, phone)).limit(1))[0];
  if (existing) {
    res.status(409).json({ error: "Já existe um usuário com este número de telefone" });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ name, phone, email: email ?? null, passwordHash: hash, role: "super_admin" })
    .returning({ id: usersTable.id, name: usersTable.name, phone: usersTable.phone, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt });

  res.status(201).json(user);
});

router.delete("/:userId", async (req, res) => {
  if (!await requireSuperAdmin(req, res)) return;

  const userId = Number(req.params.userId);

  if (userId === req.session.userId) {
    res.status(422).json({ error: "Você não pode remover sua própria conta" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.status(204).send();
});

export default router;
