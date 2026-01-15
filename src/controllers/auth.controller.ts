import { Request, Response } from "express";
import { UserModel } from "../models/User";
import { generateToken } from "../config/jwt";
import { asyncHandler } from "../middlewares/errorHandler";
import { CreateUserDTO } from "../types";

/**
 * Contrôleur Auth - Gestion de l'authentification
 */
export class AuthController {
  /**
   * Créer un utilisateur et générer un token JWT
   * POST /api/auth/register
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const userData: CreateUserDTO = req.body;

    // Créer ou récupérer l'utilisateur
    const user = await UserModel.findOrCreate(userData);

    // Générer le token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          company: user.company,
        },
        token,
      },
      message: "Utilisateur créé avec succès",
    });
  });

  /**
   * Login (simple) - Génère un token pour un email existant
   * POST /api/auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await UserModel.findByEmail(email);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "Utilisateur non trouvé",
      });
      return;
    }

    // Générer le token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          company: user.company,
        },
        token,
      },
    });
  });

  /**
   * Récupérer le profil de l'utilisateur connecté
   * GET /api/auth/me
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "Utilisateur non trouvé",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        created_at: user.created_at,
      },
    });
  });
}

export default AuthController;
