import { Router } from "express";
import WebinarController from "../controllers/webinar.controller";
import { authMiddleware } from "../middlewares/auth";
import { validate, schemas } from "../middlewares/validation";

const router = Router();

/**
 * Routes webinaires
 * Base: /api/webinars
 */

// GET /api/webinars/stats/summary - Statistiques (avant les routes avec :id)
router.get("/stats/summary", WebinarController.getStats);

// GET /api/webinars - Lister tous les webinaires
router.get("/", WebinarController.list);

// GET /api/webinars/:id - Récupérer un webinaire
router.get("/:id", validate(schemas.uuidParam, "params"), WebinarController.getById);

// GET /api/webinars/:id/registrations - Liste des inscriptions
router.get("/:id/registrations", authMiddleware, validate(schemas.uuidParam, "params"), WebinarController.getRegistrations);

// POST /api/webinars - Créer un webinaire (authentification requise)
router.post("/", authMiddleware, validate(schemas.createWebinar), WebinarController.create);

// PUT /api/webinars/:id - Mettre à jour un webinaire
router.put("/:id", authMiddleware, validate(schemas.uuidParam, "params"), validate(schemas.updateWebinar), WebinarController.update);

// DELETE /api/webinars/:id - Supprimer un webinaire
router.delete("/:id", authMiddleware, validate(schemas.uuidParam, "params"), WebinarController.delete);

export default router;
