import { Request, Response, NextFunction } from "express";

/**
 * Classe d'erreur personnalisée pour l'application
 */
export class AppError extends Error {
  constructor(public statusCode: number, public message: string, public isOperational: boolean = true) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Middleware global de gestion des erreurs
 * Doit être ajouté en dernier dans la chaîne de middlewares
 */
export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction): void => {
  // Log l'erreur pour le débogage
  console.error("❌ Erreur:", err);

  // Erreur opérationnelle (prévisible et gérée)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Erreur inattendue
  res.status(500).json({
    success: false,
    error: "Erreur serveur inattendue",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
};

/**
 * Middleware pour gérer les routes non trouvées
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: "Route non trouvée",
  });
};

/**
 * Wrapper async pour éviter les try-catch répétitifs
 * Capture automatiquement les erreurs async et les passe au middleware d'erreur
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
