import supabase from "../config/database";
import { Registration } from "../types";
import { AppError } from "../middlewares/errorHandler";

/**
 * Modèle Registration - Gestion des inscriptions
 */
export class RegistrationModel {
  /**
   * Créer une nouvelle inscription
   */
  static async create(data: { user_id: string; webinar_id: string }): Promise<Registration> {
    const { data: registration, error } = await supabase
      .from("registrations")
      .insert([
        {
          user_id: data.user_id,
          webinar_id: data.webinar_id,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      // Gérer le cas de l'inscription en double
      if (error.code === "23505") {
        throw new AppError(409, "Vous êtes déjà inscrit à ce webinaire");
      }
      throw new AppError(500, `Erreur création inscription: ${error.message}`);
    }

    return registration;
  }

  /**
   * Trouver une inscription par ID
   */
  static async findById(id: string): Promise<Registration | null> {
    const { data, error } = await supabase.from("registrations").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new AppError(500, `Erreur recherche inscription: ${error.message}`);
    }

    return data;
  }

  /**
   * Trouver une inscription avec détails complets (user + webinar)
   */
  static async findByIdWithDetails(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from("registrations")
      .select(
        `
        *,
        user:users(*),
        webinar:webinars(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new AppError(500, `Erreur recherche inscription: ${error.message}`);
    }

    return data;
  }

  /**
   * Trouver les inscriptions d'un utilisateur
   */
  static async findByUserId(userId: string): Promise<Registration[]> {
    const { data, error } = await supabase
      .from("registrations")
      .select(
        `
        *,
        webinar:webinars(*)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(500, `Erreur récupération inscriptions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Trouver les inscriptions d'un webinaire
   */
  static async findByWebinarId(webinarId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("registrations")
      .select(
        `
        *,
        user:users(*)
      `
      )
      .eq("webinar_id", webinarId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new AppError(500, `Erreur récupération inscriptions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Mettre à jour le statut de l'inscription
   */
  static async updateStatus(id: string, status: "pending" | "confirmed" | "cancelled"): Promise<Registration> {
    const { data, error } = await supabase.from("registrations").update({ status }).eq("id", id).select().single();

    if (error) {
      throw new AppError(500, `Erreur mise à jour statut: ${error.message}`);
    }

    return data;
  }

  /**
   * Lier un paiement à l'inscription
   */
  static async linkPayment(id: string, paymentId: string): Promise<void> {
    const { error } = await supabase.from("registrations").update({ payment_id: paymentId }).eq("id", id);

    if (error) {
      throw new AppError(500, `Erreur liaison paiement: ${error.message}`);
    }
  }

  /**
   * Mettre à jour le lien Meet et l'événement Calendar
   */
  static async updateMeetInfo(id: string, meetLink: string, calendarEventId: string): Promise<void> {
    const { error } = await supabase
      .from("registrations")
      .update({
        meet_link: meetLink,
        calendar_event_id: calendarEventId,
      })
      .eq("id", id);

    if (error) {
      throw new AppError(500, `Erreur mise à jour lien Meet: ${error.message}`);
    }
  }

  /**
   * Marquer le rappel comme envoyé
   */
  static async markReminderSent(id: string): Promise<void> {
    const { error } = await supabase.from("registrations").update({ reminder_sent: true }).eq("id", id);

    if (error) {
      throw new AppError(500, `Erreur marquage rappel: ${error.message}`);
    }
  }

  /**
   * Récupérer les inscriptions nécessitant un rappel (J-1)
   */
  static async getRegistrationsNeedingReminder(): Promise<any[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from("registrations")
      .select(
        `
        *,
        user:users(*),
        webinar:webinars(*)
      `
      )
      .eq("status", "confirmed")
      .eq("reminder_sent", false)
      .gte("webinar.start_date", tomorrow.toISOString())
      .lt("webinar.start_date", dayAfterTomorrow.toISOString());

    if (error) {
      throw new AppError(500, `Erreur récupération rappels: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Annuler une inscription
   */
  static async cancel(id: string): Promise<Registration> {
    return this.updateStatus(id, "cancelled");
  }

  /**
   * Supprimer une inscription
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from("registrations").delete().eq("id", id);

    if (error) {
      throw new AppError(500, `Erreur suppression inscription: ${error.message}`);
    }
  }
}
