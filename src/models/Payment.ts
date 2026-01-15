import supabase from "../config/database";
import { Payment } from "../types";
import { AppError } from "../middlewares/errorHandler";

/**
 * Modèle Payment - Gestion des paiements
 */
export class PaymentModel {
  /**
   * Créer un nouveau paiement
   */
  static async create(data: { registration_id: string; amount: number; currency?: string; sumup_checkout_id?: string }): Promise<Payment> {
    const { data: payment, error } = await supabase
      .from("payments")
      .insert([
        {
          registration_id: data.registration_id,
          amount: data.amount,
          currency: data.currency || "EUR",
          sumup_checkout_id: data.sumup_checkout_id,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      throw new AppError(500, `Erreur création paiement: ${error.message}`);
    }

    return payment;
  }

  /**
   * Trouver un paiement par ID
   */
  static async findById(id: string): Promise<Payment | null> {
    const { data, error } = await supabase.from("payments").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new AppError(500, `Erreur recherche paiement: ${error.message}`);
    }

    return data;
  }

  /**
   * Trouver un paiement par checkout ID SumUp
   */
  static async findByCheckoutId(checkoutId: string): Promise<Payment | null> {
    const { data, error } = await supabase.from("payments").select("*").eq("sumup_checkout_id", checkoutId).single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new AppError(500, `Erreur recherche paiement: ${error.message}`);
    }

    return data;
  }

  /**
   * Trouver un paiement par registration ID
   */
  static async findByRegistrationId(registrationId: string): Promise<Payment | null> {
    const { data, error } = await supabase.from("payments").select("*").eq("registration_id", registrationId).single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new AppError(500, `Erreur recherche paiement: ${error.message}`);
    }

    return data;
  }

  /**
   * Mettre à jour le statut du paiement
   */
  static async updateStatus(id: string, status: "pending" | "completed" | "failed" | "refunded", transactionId?: string): Promise<Payment> {
    const updateData: any = { status };

    if (status === "completed") {
      updateData.payment_date = new Date().toISOString();
    }

    if (transactionId) {
      updateData.sumup_transaction_id = transactionId;
    }

    const { data, error } = await supabase.from("payments").update(updateData).eq("id", id).select().single();

    if (error) {
      throw new AppError(500, `Erreur mise à jour paiement: ${error.message}`);
    }

    return data;
  }

  /**
   * Générer un numéro de facture unique
   */
  static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    // Compter les paiements complétés ce mois-ci
    const { count, error } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("payment_date", `${year}-${month}-01`)
      .lt("payment_date", `${year}-${month === "12" ? "01" : String(Number(month) + 1).padStart(2, "0")}-01`);

    if (error) {
      throw new AppError(500, `Erreur génération numéro facture: ${error.message}`);
    }

    const invoiceCount = (count || 0) + 1;
    return `INV-${year}${month}-${String(invoiceCount).padStart(4, "0")}`;
  }

  /**
   * Mettre à jour les informations de la facture
   */
  static async updateInvoice(id: string, invoiceNumber: string, invoicePdfUrl?: string): Promise<void> {
    const { error } = await supabase
      .from("payments")
      .update({
        invoice_number: invoiceNumber,
        invoice_pdf_url: invoicePdfUrl,
      })
      .eq("id", id);

    if (error) {
      throw new AppError(500, `Erreur mise à jour facture: ${error.message}`);
    }
  }

  /**
   * Lister tous les paiements avec filtres
   */
  static async list(
    filters: {
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ payments: Payment[]; total: number }> {
    const { status, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    let query = supabase.from("payments").select("*", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new AppError(500, `Erreur récupération paiements: ${error.message}`);
    }

    return {
      payments: data || [],
      total: count || 0,
    };
  }

  /**
   * Calculer le montant total des paiements complétés
   */
  static async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    let query = supabase.from("payments").select("amount").eq("status", "completed");

    if (startDate) {
      query = query.gte("payment_date", startDate.toISOString());
    }

    if (endDate) {
      query = query.lte("payment_date", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(500, `Erreur calcul revenu: ${error.message}`);
    }

    return (data || []).reduce((sum, payment) => sum + Number(payment.amount), 0);
  }
}
