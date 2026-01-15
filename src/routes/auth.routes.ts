import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth";
import { validate, schemas } from "../middlewares/validation";

const router = Router();

/**
 * Routes d'authentification
 * Base: /api/auth
 */

// POST /api/auth/register - Créer un compte utilisateur
router.post("/register", validate(schemas.createUser), AuthController.register);

// POST /api/auth/login - Se connecter (simple)
router.post("/login", AuthController.login);

// GET /api/auth/me - Récupérer le profil utilisateur connecté
router.get("/me", authMiddleware, AuthController.getProfile);

export default router;
