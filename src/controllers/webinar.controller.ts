import { Request, Response } from "express";
import { WebinarModel } from "../models/Webinar";
import { RegistrationModel } from "../models/Registration";
import { asyncHandler, AppError } from "../middlewares/errorHandler";
import { CreateWebinarDTO, UpdateWebinarDTO } from "../types";

/**
 * Contrôleur Webinar - Gestion des webinaires
 */
export class WebinarController {
  /**
   * Créer un nouveau webinaire
   * POST /api/webinars
   */
  static create = asyncHandler(async (req: Request, res: Response) => {
    const webinarData: CreateWebinarDTO = req.body;

    const webinar = await WebinarModel.create(webinarData);

    res.status(201).json({
      success: true,
      data: webinar,
      message: "Webinaire créé avec succès",
    });
  });

  /**
   * Lister tous les webinaires avec filtres
   * GET /api/webinars
   */
  static list = asyncHandler(async (req: Request, res: Response) => {
    const { status, upcoming, page = "1", limit = "50" } = req.query;

    const { webinars, total } = await WebinarModel.list({
      status: status as any,
      upcoming: upcoming === "true",
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: {
        webinars,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  });

  /**
   * Récupérer un webinaire par ID avec statistiques
   * GET /api/webinars/:id
   */
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const webinar = await WebinarModel.findById(id);

    if (!webinar) {
      throw new AppError(404, "Webinaire non trouvé");
    }

    // Récupérer les statistiques
    const registrationCount = await WebinarModel.countRegistrations(id);
    const isFull = await WebinarModel.isFull(id);
    const availableSpots = webinar.max_participants - registrationCount;

    res.json({
      success: true,
      data: {
        ...webinar,
        stats: {
          registrations: registrationCount,
          availableSpots,
          isFull,
        },
      },
    });
  });

  /**
   * Mettre à jour un webinaire
   * PUT /api/webinars/:id
   */
  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates: UpdateWebinarDTO = req.body;

    // Vérifier que le webinaire existe
    const existing = await WebinarModel.findById(id);
    if (!existing) {
      throw new AppError(404, "Webinaire non trouvé");
    }

    const webinar = await WebinarModel.update(id, updates);

    res.json({
      success: true,
      data: webinar,
      message: "Webinaire mis à jour avec succès",
    });
  });

  /**
   * Supprimer un webinaire
   * DELETE /api/webinars/:id
   */
  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Vérifier que le webinaire existe
    const existing = await WebinarModel.findById(id);
    if (!existing) {
      throw new AppError(404, "Webinaire non trouvé");
    }

    // Vérifier qu'il n'y a pas d'inscriptions confirmées
    const registrationCount = await WebinarModel.countRegistrations(id);
    if (registrationCount > 0) {
      throw new AppError(400, "Impossible de supprimer un webinaire avec des inscriptions confirmées");
    }

    await WebinarModel.delete(id);

    res.json({
      success: true,
      message: "Webinaire supprimé avec succès",
    });
  });

  /**
   * Lister les inscriptions d'un webinaire
   * GET /api/webinars/:id/registrations
   */
  static getRegistrations = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Vérifier que le webinaire existe
    const webinar = await WebinarModel.findById(id);
    if (!webinar) {
      throw new AppError(404, "Webinaire non trouvé");
    }

    const registrations = await RegistrationModel.findByWebinarId(id);

    res.json({
      success: true,
      data: {
        webinar: {
          id: webinar.id,
          title: webinar.title,
          start_date: webinar.start_date,
        },
        registrations,
        total: registrations.length,
      },
    });
  });

  /**
   * Obtenir des statistiques sur les webinaires
   * GET /api/webinars/stats/summary
   */
  static getStats = asyncHandler(async (req: Request, res: Response) => {
    const { webinars: allWebinars } = await WebinarModel.list({ limit: 1000 });

    const stats = {
      total: allWebinars.length,
      active: allWebinars.filter((w) => w.status === "active").length,
      completed: allWebinars.filter((w) => w.status === "completed").length,
      cancelled: allWebinars.filter((w) => w.status === "cancelled").length,
      upcoming: allWebinars.filter((w) => w.status === "active" && new Date(w.start_date) > new Date()).length,
    };

    res.json({
      success: true,
      data: stats,
    });
  });
}

export default WebinarController;
