import { Router } from "express";
import RegistrationController from "../controllers/registration.controller";
import { authMiddleware } from "../middlewares/auth";
import { validate, schemas } from "../middlewares/validation";

const router = Router();

/**
 * Routes inscriptions
 * Base: /api/registrations
 */

// POST /api/registrations - Créer une inscription (pas besoin d'auth)
router.post("/", validate(schemas.createRegistration), RegistrationController.create);

// GET /api/registrations/my - Mes inscriptions (authentification requise)
router.get("/my", authMiddleware, RegistrationController.getMyRegistrations);

// GET /api/registrations/:id - Récupérer une inscription
router.get("/:id", validate(schemas.uuidParam, "params"), RegistrationController.getById);

// DELETE /api/registrations/:id - Annuler une inscription
router.delete("/:id", authMiddleware, validate(schemas.uuidParam, "params"), RegistrationController.cancel);

export default router;
