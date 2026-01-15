import { Request, Response, NextFunction } from "express";
import { verifyToken, extractToken } from "../config/jwt";

/**
 * Middleware d'authentification JWT
 * Vérifie la présence et la validité du token dans le header Authorization
 * Ajoute les données utilisateur à req.user si valide
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Extraire le token du header
    const token = extractToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Token manquant. Authentification requise.",
      });
      return;
    }

    // Vérifier et décoder le token
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        error: "Token invalide ou expiré.",
      });
      return;
    }

    // Ajouter les données utilisateur à la requête
    req.user = payload;
    next();
  } catch (error) {
    console.error("Erreur middleware auth:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de l'authentification.",
    });
  }
};

/**
 * Middleware optionnel - N'échoue pas si le token est manquant
 * Utile pour les routes où l'authentification est optionnelle
 */
export const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = extractToken(req.headers.authorization);

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        req.user = payload;
      }
    }

    next();
  } catch (error) {
    console.error("Erreur middleware auth optionnel:", error);
    next();
  }
};
