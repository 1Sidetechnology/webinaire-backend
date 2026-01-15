import { Router } from "express";
import authRoutes from "./auth.routes";
import webinarRoutes from "./webinar.routes";
import registrationRoutes from "./registration.routes";
import paymentRoutes from "./payment.routes";

const router = Router();

/**
 * Routes API principales
 * Toutes les routes sont préfixées par /api dans app.ts
 */

// Routes d'authentification
router.use("/auth", authRoutes);

// Routes webinaires
router.use("/webinars", webinarRoutes);

// Routes inscriptions
router.use("/registrations", registrationRoutes);

// Routes paiements
router.use("/payment", paymentRoutes);

export default router;
