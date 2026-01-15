import { Request, Response } from "express";
import { UserModel } from "../models/User";
import { WebinarModel } from "../models/Webinar";
import { RegistrationModel } from "../models/Registration";
import { PaymentModel } from "../models/Payment";
import { SumUpService } from "../services/sumup.service";
import { GoogleService } from "../services/google.service";
import { EmailService } from "../services/email.service";
import { PDFService } from "../services/pdf.service";
import { asyncHandler, AppError } from "../middlewares/errorHandler";
import { CreateRegistrationDTO } from "../types";

/**
 * Contrôleur Registration - Gestion des inscriptions
 */
export class RegistrationController {
  /**
   * Créer une inscription (workflow complet)
   * POST /api/registrations
   *
   * Workflow:
   * 1. Créer/récupérer l'utilisateur
   * 2. Vérifier la disponibilité du webinaire
   * 3. Créer l'inscription
   * 4. Créer le paiement SumUp
   * 5. Retourner l'URL de paiement
   */
  static create = asyncHandler(async (req: Request, res: Response) => {
    const registrationData: CreateRegistrationDTO = req.body;

    // 1. Créer ou récupérer l'utilisateur
    const user = await UserModel.findOrCreate(registrationData.user);

    // 2. Vérifier que le webinaire existe et est disponible
    const webinar = await WebinarModel.findById(registrationData.webinar_id);
    if (!webinar) {
      throw new AppError(404, "Webinaire non trouvé");
    }

    if (webinar.status !== "active") {
      throw new AppError(400, "Ce webinaire n'est plus disponible");
    }

    // Vérifier la disponibilité
    const isFull = await WebinarModel.isFull(webinar.id);
    if (isFull) {
      throw new AppError(400, "Ce webinaire est complet");
    }

    // Vérifier que l'utilisateur n'est pas déjà inscrit
    const existingRegistrations = await RegistrationModel.findByUserId(user.id);
    const alreadyRegistered = existingRegistrations.some((r) => r.webinar_id === webinar.id && r.status !== "cancelled");

    if (alreadyRegistered) {
      throw new AppError(409, "Vous êtes déjà inscrit à ce webinaire");
    }

    // 3. Créer l'inscription
    const registration = await RegistrationModel.create({
      user_id: user.id,
      webinar_id: webinar.id,
    });

    // 4. Créer le paiement SumUp (si le webinaire est payant)
    if (webinar.price > 0) {
      const payment = await PaymentModel.create({
        registration_id: registration.id,
        amount: webinar.price,
        currency: "EUR",
      });

      // Créer le checkout SumUp
      const { checkoutId, checkoutUrl } = await SumUpService.createCheckout(registration.id, webinar.price, `Webinaire : ${webinar.title}`);

      // Mettre à jour le paiement avec le checkout ID
      await PaymentModel.updateStatus(payment.id, "pending");

      // Lier le paiement à l'inscription
      await RegistrationModel.linkPayment(registration.id, payment.id);

      res.status(201).json({
        success: true,
        data: {
          registration: {
            id: registration.id,
            status: registration.status,
          },
          payment: {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            checkout_url: checkoutUrl,
          },
          webinar: {
            id: webinar.id,
            title: webinar.title,
            start_date: webinar.start_date,
          },
        },
        message: "Inscription créée. Veuillez procéder au paiement.",
      });
    } else {
      // Webinaire gratuit - confirmer directement
      await this.confirmRegistration(registration.id, webinar);

      res.status(201).json({
        success: true,
        data: {
          registration: {
            id: registration.id,
            status: "confirmed",
          },
          webinar: {
            id: webinar.id,
            title: webinar.title,
            start_date: webinar.start_date,
          },
        },
        message: "Inscription confirmée avec succès !",
      });
    }
  });

  /**
   * Confirmer une inscription après paiement réussi
   * Cette fonction est appelée par le webhook SumUp
   */
  private static async confirmRegistration(registrationId: string, webinar: any): Promise<void> {
    const registration = await RegistrationModel.findByIdWithDetails(registrationId);
    if (!registration) {
      throw new AppError(404, "Inscription non trouvée");
    }

    // 1. Créer l'événement Google Calendar avec Meet
    const { eventId, meetLink } = await GoogleService.createEvent(
      {
        title: webinar.title,
        description: webinar.description || "",
        startDate: new Date(webinar.start_date),
        endDate: new Date(webinar.end_date),
      },
      registration.user.email
    );

    // 2. Mettre à jour l'inscription avec le lien Meet
    await RegistrationModel.updateMeetInfo(registrationId, meetLink, eventId);

    // 3. Confirmer l'inscription
    await RegistrationModel.updateStatus(registrationId, "confirmed");

    // 4. Générer la facture si paiement effectué
    let invoiceBuffer: Buffer | undefined;
    if (registration.payment_id) {
      const payment = await PaymentModel.findById(registration.payment_id);
      if (payment && payment.status === "completed") {
        const invoiceNumber = await PaymentModel.generateInvoiceNumber();

        invoiceBuffer = await PDFService.generateInvoice({
          invoiceNumber,
          invoiceDate: payment.payment_date || new Date(),
          customerName: registration.user.name,
          customerEmail: registration.user.email,
          customerCompany: registration.user.company,
          webinarTitle: webinar.title,
          webinarDate: new Date(webinar.start_date),
          amount: payment.amount,
          paymentMethod: "SumUp",
        });

        await PaymentModel.updateInvoice(payment.id, invoiceNumber);
      }
    }

    // 5. Envoyer l'email de confirmation
    await EmailService.sendRegistrationConfirmation({
      to: registration.user.email,
      userName: registration.user.name,
      webinarTitle: webinar.title,
      webinarDate: new Date(webinar.start_date),
      meetLink,
      invoiceBuffer,
    });
  }

  /**
   * Récupérer les inscriptions de l'utilisateur connecté
   * GET /api/registrations/my
   */
  static getMyRegistrations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const registrations = await RegistrationModel.findByUserId(userId);

    res.json({
      success: true,
      data: registrations,
      total: registrations.length,
    });
  });

  /**
   * Récupérer une inscription par ID
   * GET /api/registrations/:id
   */
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const registration = await RegistrationModel.findByIdWithDetails(id);

    if (!registration) {
      throw new AppError(404, "Inscription non trouvée");
    }

    res.json({
      success: true,
      data: registration,
    });
  });

  /**
   * Annuler une inscription
   * DELETE /api/registrations/:id
   */
  static cancel = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const registration = await RegistrationModel.findById(id);

    if (!registration) {
      throw new AppError(404, "Inscription non trouvée");
    }

    // Vérifier que l'utilisateur possède cette inscription
    if (registration.user_id !== userId) {
      throw new AppError(403, "Vous n'êtes pas autorisé à annuler cette inscription");
    }

    if (registration.status === "cancelled") {
      throw new AppError(400, "Cette inscription est déjà annulée");
    }

    // Annuler l'inscription
    await RegistrationModel.cancel(id);

    // Supprimer l'événement Google Calendar si existant
    if (registration.calendar_event_id) {
      try {
        await GoogleService.deleteEvent(registration.calendar_event_id);
      } catch (error) {
        console.error("Erreur suppression événement Google:", error);
      }
    }

    res.json({
      success: true,
      message: "Inscription annulée avec succès",
    });
  });

  /**
   * Méthode exposée pour confirmer une inscription (appelée par le webhook)
   */
  static confirmRegistrationPublic = asyncHandler(async (req: Request, res: Response) => {
    const { registrationId, webinarId } = req.body;

    const webinar = await WebinarModel.findById(webinarId);
    if (!webinar) {
      throw new AppError(404, "Webinaire non trouvé");
    }

    await RegistrationController.confirmRegistration(registrationId, webinar);

    res.json({
      success: true,
      message: "Inscription confirmée",
    });
  });
}

export default RegistrationController;
