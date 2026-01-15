import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

/**
 * Middleware générique de validation avec Zod
 * Valide le body, query ou params de la requête selon le schéma fourni
 */
export const validate = (schema: ZodSchema, source: "body" | "query" | "params" = "body") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation échouée",
          details: error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Erreur de validation",
      });
    }
  };
};

// Schémas de validation réutilisables
export const schemas = {
  // Validation pour créer un utilisateur
  createUser: z.object({
    email: z.string().email("Email invalide"),
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    company: z.string().optional(),
  }),

  // Validation pour créer un webinaire
  createWebinar: z.object({
    title: z.string().min(5, "Le titre doit contenir au moins 5 caractères"),
    description: z.string().optional(),
    start_date: z.string().datetime("Date de début invalide"),
    end_date: z.string().datetime("Date de fin invalide"),
    price: z.number().min(0, "Le prix ne peut pas être négatif"),
    max_participants: z.number().int().min(1).optional().default(100),
  }),

  // Validation pour mettre à jour un webinaire
  updateWebinar: z.object({
    title: z.string().min(5).optional(),
    description: z.string().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    price: z.number().min(0).optional(),
    max_participants: z.number().int().min(1).optional(),
    status: z.enum(["active", "cancelled", "completed"]).optional(),
  }),

  // Validation pour créer une inscription
  createRegistration: z.object({
    webinar_id: z.string().uuid("ID webinaire invalide"),
    user: z.object({
      email: z.string().email("Email invalide"),
      name: z.string().min(2),
      company: z.string().optional(),
    }),
  }),

  // Validation pour les paramètres UUID
  uuidParam: z.object({
    id: z.string().uuid("ID invalide"),
  }),
};
