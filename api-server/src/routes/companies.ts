import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, companiesTable, usersTable, companyUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateCompanyBody, UpdateCompanyBody, UpdateCompanyStatusBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const companies = await db.select().from(companiesTable).orderBy(companiesTable.createdAt);
  res.json(companies);
});

router.post("/", async (req, res) => {
  const parsed = CreateCompanyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { adminName, adminPhone, adminPassword, ...companyData } = parsed.data;

  const [company] = await db.insert(companiesTable).values(companyData).returning();

  if (adminPhone && adminPassword) {
    const existing = (await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.phone, adminPhone)).limit(1))[0];
    if (existing) {
      await db.delete(companiesTable).where(eq(companiesTable.id, company.id));
      res.status(409).json({ error: "Já existe um usuário com este número de telefone" });
      return;
    }

    const hash = await bcrypt.hash(adminPassword, 10);
    const [user] = await db
      .insert(usersTable)
      .values({ name: adminName || adminPhone, phone: adminPhone, passwordHash: hash })
      .returning();
    await db
      .insert(companyUsersTable)
      .values({ userId: user.id, companyId: company.id, role: "admin" })
      .onConflictDoNothing();
    const [updated] = await db
      .update(companiesTable)
      .set({ responsibleUserId: user.id })
      .where(eq(companiesTable.id, company.id))
      .returning();
    res.status(201).json(updated);
    return;
  }

  res.status(201).json(company);
});

router.get("/:companyId", async (req, res) => {
  const id = Number(req.params.companyId);
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, id)).limit(1);
  if (!company) { res.status(404).json({ error: "Not found" }); return; }
  res.json(company);
});

router.patch("/:companyId", async (req, res) => {
  const id = Number(req.params.companyId);
  const parsed = UpdateCompanyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [company] = await db.update(companiesTable).set(parsed.data).where(eq(companiesTable.id, id)).returning();
  if (!company) { res.status(404).json({ error: "Not found" }); return; }
  res.json(company);
});

router.patch("/:companyId/status", async (req, res) => {
  const id = Number(req.params.companyId);
  const parsed = UpdateCompanyStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [company] = await db.update(companiesTable).set({ status: parsed.data.status }).where(eq(companiesTable.id, id)).returning();
  if (!company) { res.status(404).json({ error: "Not found" }); return; }
  res.json(company);
});

router.patch("/:companyId/responsible", async (req, res) => {
  const id = Number(req.params.companyId);
  const { userId } = req.body as { userId: number };
  if (!userId || typeof userId !== "number") {
    res.status(400).json({ error: "userId é obrigatório" });
    return;
  }
  const [cu] = await db
    .select()
    .from(companyUsersTable)
    .where(eq(companyUsersTable.companyId, id))
    .limit(50);
  const users = await db.select().from(companyUsersTable).where(eq(companyUsersTable.companyId, id));
  const isMember = users.some(u => u.userId === userId);
  if (!isMember) {
    res.status(422).json({ error: "Usuário não pertence a esta empresa" });
    return;
  }
  const [company] = await db
    .update(companiesTable)
    .set({ responsibleUserId: userId })
    .where(eq(companiesTable.id, id))
    .returning();
  if (!company) { res.status(404).json({ error: "Not found" }); return; }
  res.json(company);
});

export default router;
