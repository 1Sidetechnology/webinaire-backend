import { Router } from "express";
import PaymentController from "../controllers/payment.controller";
import { authMiddleware } from "../middlewares/auth";
import { validate, schemas } from "../middlewares/validation";

const router = Router();

/**
 * Routes paiements
 * Base: /api/payment
 */

// POST /api/payment/webhook - Webhook SumUp (pas d'authentification)
router.post("/webhook", PaymentController.webhook);

// GET /api/payment/return - Page de retour après paiement
router.get("/return", PaymentController.returnUrl);

// GET /api/payment - Lister tous les paiements (admin, authentification requise)
router.get("/", authMiddleware, PaymentController.list);

// GET /api/payment/:id/status - Vérifier le statut d'un paiement
router.get("/:id/status", validate(schemas.uuidParam, "params"), PaymentController.checkStatus);

export default router;
