import { Request, Response } from "express";
import { PaymentModel } from "../models/Payment";
import { RegistrationModel } from "../models/Registration";
import { WebinarModel } from "../models/Webinar";
import { SumUpService } from "../services/sumup.service";
import { RegistrationController } from "./registration.controller";
import { asyncHandler, AppError } from "../middlewares/errorHandler";

/**
 * Contrôleur Payment - Gestion des paiements et webhooks
 */
export class PaymentController {
  /**
   * Webhook SumUp - Notification de paiement
   * POST /api/payment/webhook
   *
   * Appelé par SumUp après chaque paiement
   */
  static webhook = asyncHandler(async (req: Request, res: Response) => {
    // 1. Vérifier la signature du webhook
    const signature = req.headers["x-sumup-signature"] as string;
    const rawBody = JSON.stringify(req.body);

    if (!SumUpService.verifyWebhookSignature(rawBody, signature)) {
      throw new AppError(401, "Signature webhook invalide");
    }

    // 2. Traiter le payload
    const webhookData = SumUpService.processWebhook(req.body);

    console.log("📥 Webhook SumUp reçu:", webhookData);

    // 3. Récupérer le paiement
    const payment = await PaymentModel.findByCheckoutId(webhookData.checkoutId);

    if (!payment) {
      console.error("❌ Paiement non trouvé pour checkout:", webhookData.checkoutId);
      // Renvoyer 200 pour ne pas que SumUp réessaie
      res.status(200).json({ received: true });
      return;
    }

    // 4. Vérifier que le paiement n'a pas déjà été traité
    if (payment.status === "completed") {
      console.log("✅ Paiement déjà traité");
      res.status(200).json({ received: true });
      return;
    }

    // 5. Mettre à jour le statut du paiement
    if (webhookData.status === "completed") {
      await PaymentModel.updateStatus(payment.id, "completed", webhookData.transactionId);

      // 6. Récupérer l'inscription et le webinaire
      const registration = await RegistrationModel.findById(payment.registration_id);
      if (!registration) {
        throw new AppError(404, "Inscription non trouvée");
      }

      const webinar = await WebinarModel.findById(registration.webinar_id);
      if (!webinar) {
        throw new AppError(404, "Webinaire non trouvé");
      }

      // 7. Confirmer l'inscription (créer l'événement Calendar, envoyer l'email, etc.)
      try {
        await (RegistrationController as any).confirmRegistration(registration.id, webinar);
        console.log("✅ Inscription confirmée après paiement:", registration.id);
      } catch (error) {
        console.error("❌ Erreur confirmation inscription:", error);
        // On ne lance pas d'erreur pour ne pas bloquer le webhook
      }
    } else if (webhookData.status === "failed") {
      await PaymentModel.updateStatus(payment.id, "failed");
      console.log("❌ Paiement échoué:", payment.id);
    }

    // 8. Confirmer la réception du webhook
    res.status(200).json({
      success: true,
      message: "Webhook traité",
    });
  });

  /**
   * Page de retour après paiement SumUp
   * GET /api/payment/return
   */
  static returnUrl = asyncHandler(async (req: Request, res: Response) => {
    const { checkout_id } = req.query;

    if (!checkout_id) {
      res.status(400).send("Checkout ID manquant");
      return;
    }

    // Vérifier le statut du paiement
    const paymentStatus = await SumUpService.checkPaymentStatus(checkout_id as string);

    if (paymentStatus.status === "completed") {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Paiement réussi</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f0f0f0;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .success { color: #4CAF50; font-size: 48px; }
            h1 { color: #333; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅</div>
            <h1>Paiement réussi !</h1>
            <p>Votre inscription a été confirmée.</p>
            <p>Vous allez recevoir un email avec tous les détails.</p>
          </div>
        </body>
        </html>
      `);
    } else if (paymentStatus.status === "failed") {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Paiement échoué</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f0f0f0;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .error { color: #f44336; font-size: 48px; }
            h1 { color: #333; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌</div>
            <h1>Paiement échoué</h1>
            <p>Le paiement n'a pas pu être effectué.</p>
            <p>Veuillez réessayer ou nous contacter.</p>
          </div>
        </body>
        </html>
      `);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Paiement en cours</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f0f0f0;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .pending { color: #FF9800; font-size: 48px; }
            h1 { color: #333; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="pending">⏳</div>
            <h1>Paiement en cours</h1>
            <p>Votre paiement est en cours de traitement.</p>
            <p>Vous recevrez une confirmation par email sous peu.</p>
          </div>
        </body>
        </html>
      `);
    }
  });

  /**
   * Vérifier le statut d'un paiement
   * GET /api/payment/:id/status
   */
  static checkStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const payment = await PaymentModel.findById(id);

    if (!payment) {
      throw new AppError(404, "Paiement non trouvé");
    }

    // Si le paiement a un checkout SumUp, vérifier le statut
    if (payment.sumup_checkout_id && payment.status === "pending") {
      const sumupStatus = await SumUpService.checkPaymentStatus(payment.sumup_checkout_id);

      // Mettre à jour si nécessaire
      if (sumupStatus.status !== payment.status) {
        await PaymentModel.updateStatus(payment.id, sumupStatus.status, sumupStatus.transactionId);
      }
    }

    // Récupérer le paiement mis à jour
    const updatedPayment = await PaymentModel.findById(id);

    res.json({
      success: true,
      data: updatedPayment,
    });
  });

  /**
   * Lister tous les paiements (admin)
   * GET /api/payment
   */
  static list = asyncHandler(async (req: Request, res: Response) => {
    const { status, page = "1", limit = "50" } = req.query;

    const { payments, total } = await PaymentModel.list({
      status: status as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  });
}

export default PaymentController;
