import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import companiesRouter from "./companies";
import companyUsersRouter from "./company-users";
import adminUsersRouter from "./admin-users";
import structuresRouter from "./structures";
import reservationsRouter from "./reservations";
import plansRouter, { subscriptionRouter } from "./plans";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/companies", companiesRouter);
router.use("/companies/:companyId/users", companyUsersRouter);
router.use("/users", adminUsersRouter);
router.use("/companies/:companyId/structures", structuresRouter);
router.use("/companies/:companyId/reservations", reservationsRouter);
router.use("/companies/:companyId/dashboard", dashboardRouter);
router.use("/companies/:companyId/subscription", subscriptionRouter);
router.use("/plans", plansRouter);

export default router;
