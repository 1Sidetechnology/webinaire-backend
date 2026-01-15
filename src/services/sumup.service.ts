import axios from "axios";
import crypto from "crypto";
import env from "../config/env";
import { AppError } from "../middlewares/errorHandler";
import { SumUpCheckoutRequest, SumUpCheckoutResponse, SumUpWebhookPayload } from "../types";

/**
 * Service SumUp - Gestion des paiements via SumUp API
 */
export class SumUpService {
  private static readonly API_URL = env.SUMUP_API_URL;
  private static readonly API_KEY = env.SUMUP_API_KEY;
  private static readonly MERCHANT_CODE = env.SUMUP_MERCHANT_CODE;

  /**
   * Créer une session de paiement (checkout) SumUp
   * @param registrationId - ID de l'inscription
   * @param amount - Montant en euros
   * @param description - Description du paiement
   * @returns Checkout ID et URL de paiement
   */
  static async createCheckout(registrationId: string, amount: number, description: string): Promise<{ checkoutId: string; checkoutUrl: string }> {
    try {
      const checkoutReference = `REG-${registrationId}`;

      const payload: SumUpCheckoutRequest = {
        checkout_reference: checkoutReference,
        amount: amount,
        currency: "EUR",
        merchant_code: this.MERCHANT_CODE,
        description: description,
        return_url: `${env.API_URL}/payment/return`,
      };

      const response = await axios.post<SumUpCheckoutResponse>(`${this.API_URL}/checkouts`, payload, {
        headers: {
          Authorization: `Bearer ${this.API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      const checkoutId = response.data.id;
      const checkoutUrl = `https://pay.sumup.com/${checkoutId}`;

      console.log("✅ Checkout SumUp créé:", checkoutId);

      return {
        checkoutId,
        checkoutUrl,
      };
    } catch (error: any) {
      console.error("❌ Erreur création checkout SumUp:", error.response?.data || error.message);
      throw new AppError(500, "Erreur lors de la création du paiement SumUp");
    }
  }

  /**
   * Récupérer les détails d'un checkout
   * @param checkoutId - ID du checkout SumUp
   * @returns Informations sur le checkout
   */
  static async getCheckout(checkoutId: string): Promise<SumUpCheckoutResponse> {
    try {
      const response = await axios.get<SumUpCheckoutResponse>(`${this.API_URL}/checkouts/${checkoutId}`, {
        headers: {
          Authorization: `Bearer ${this.API_KEY}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("❌ Erreur récupération checkout:", error.response?.data || error.message);
      throw new AppError(500, "Erreur lors de la récupération du paiement");
    }
  }

  /**
   * Vérifier le statut d'un paiement
   * @param checkoutId - ID du checkout
   * @returns Statut du paiement
   */
  static async checkPaymentStatus(checkoutId: string): Promise<{
    status: "pending" | "completed" | "failed";
    transactionId?: string;
  }> {
    try {
      const checkout = await this.getCheckout(checkoutId);

      // Mapping des statuts SumUp vers nos statuts internes
      const statusMap: Record<string, "pending" | "completed" | "failed"> = {
        PENDING: "pending",
        PAID: "completed",
        FAILED: "failed",
        CANCELLED: "failed",
      };

      return {
        status: statusMap[checkout.status] || "pending",
        transactionId: checkout.status === "PAID" ? checkout.id : undefined,
      };
    } catch (error) {
      console.error("❌ Erreur vérification statut:", error);
      throw new AppError(500, "Erreur lors de la vérification du paiement");
    }
  }

  /**
   * Vérifier la signature du webhook SumUp
   * @param payload - Corps de la requête webhook
   * @param signature - Signature fournie dans le header
   * @returns true si la signature est valide
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto.createHmac("sha256", env.SUMUP_WEBHOOK_SECRET).update(payload).digest("hex");

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
      console.error("❌ Erreur vérification signature:", error);
      return false;
    }
  }

  /**
   * Traiter le payload d'un webhook SumUp
   * @param payload - Données du webhook
   * @returns Informations extraites du webhook
   */
  static processWebhook(payload: SumUpWebhookPayload): {
    checkoutId: string;
    status: "pending" | "completed" | "failed";
    transactionId?: string;
    amount: number;
  } {
    const statusMap: Record<string, "pending" | "completed" | "failed"> = {
      PENDING: "pending",
      PAID: "completed",
      FAILED: "failed",
      CANCELLED: "failed",
    };

    return {
      checkoutId: payload.id,
      status: statusMap[payload.status] || "pending",
      transactionId: payload.transaction_id,
      amount: payload.amount,
    };
  }

  /**
   * Créer un remboursement (si nécessaire)
   * Note: L'API SumUp peut nécessiter des permissions spéciales pour les remboursements
   */
  static async createRefund(transactionId: string, amount: number): Promise<void> {
    try {
      await axios.post(
        `${this.API_URL}/me/refund/${transactionId}`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Remboursement créé pour:", transactionId);
    } catch (error: any) {
      console.error("❌ Erreur création remboursement:", error.response?.data || error.message);
      throw new AppError(500, "Erreur lors de la création du remboursement");
    }
  }
}

export default SumUpService;
