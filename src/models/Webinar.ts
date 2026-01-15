import supabase from "../config/database";
import { Webinar, CreateWebinarDTO, UpdateWebinarDTO } from "../types";
import { AppError } from "../middlewares/errorHandler";

/**
 * Modèle Webinar - Gestion des webinaires
 */
export class WebinarModel {
  /**
   * Créer un nouveau webinaire
   */
  static async create(webinarData: CreateWebinarDTO): Promise<Webinar> {
    // Vérifier que la date de fin est après la date de début
    const start = new Date(webinarData.start_date);
    const end = new Date(webinarData.end_date);

    if (end <= start) {
      throw new AppError(400, "La date de fin doit être après la date de début");
    }

    const { data, error } = await supabase
      .from("webinars")
      .insert([
        {
          ...webinarData,
          status: "active",
        },
      ])
      .select()
      .single();

    if (error) {
      throw new AppError(500, `Erreur création webinaire: ${error.message}`);
    }

    return data;
  }

  /**
   * Trouver un webinaire par ID
   */
  static async findById(id: string): Promise<Webinar | null> {
    const { data, error } = await supabase.from("webinars").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new AppError(500, `Erreur recherche webinaire: ${error.message}`);
    }

    return data;
  }

  /**
   * Lister tous les webinaires avec filtres
   */
  static async list(
    filters: {
      status?: "active" | "cancelled" | "completed";
      upcoming?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ webinars: Webinar[]; total: number }> {
    const { status, upcoming, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    let query = supabase.from("webinars").select("*", { count: "exact" });

    // Filtrer par statut
    if (status) {
      query = query.eq("status", status);
    }

    // Filtrer les webinaires à venir
    if (upcoming) {
      query = query.gte("start_date", new Date().toISOString());
    }

    // Trier par date de début
    query = query.order("start_date", { ascending: true });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new AppError(500, `Erreur récupération webinaires: ${error.message}`);
    }

    return {
      webinars: data || [],
      total: count || 0,
    };
  }

  /**
   * Mettre à jour un webinaire
   */
  static async update(id: string, updates: UpdateWebinarDTO): Promise<Webinar> {
    // Si les dates sont mises à jour, vérifier la cohérence
    if (updates.start_date && updates.end_date) {
      const start = new Date(updates.start_date);
      const end = new Date(updates.end_date);

      if (end <= start) {
        throw new AppError(400, "La date de fin doit être après la date de début");
      }
    }

    const { data, error } = await supabase.from("webinars").update(updates).eq("id", id).select().single();

    if (error) {
      throw new AppError(500, `Erreur mise à jour webinaire: ${error.message}`);
    }

    return data;
  }

  /**
   * Supprimer un webinaire
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from("webinars").delete().eq("id", id);

    if (error) {
      throw new AppError(500, `Erreur suppression webinaire: ${error.message}`);
    }
  }

  /**
   * Compter les inscriptions pour un webinaire
   */
  static async countRegistrations(id: string): Promise<number> {
    const { count, error } = await supabase.from("registrations").select("*", { count: "exact", head: true }).eq("webinar_id", id).eq("status", "confirmed");

    if (error) {
      throw new AppError(500, `Erreur comptage inscriptions: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Vérifier si un webinaire est complet
   */
  static async isFull(id: string): Promise<boolean> {
    const webinar = await this.findById(id);
    if (!webinar) {
      throw new AppError(404, "Webinaire non trouvé");
    }

    const registrationCount = await this.countRegistrations(id);
    return registrationCount >= webinar.max_participants;
  }

  /**
   * Mettre à jour le calendar_event_id
   */
  static async updateCalendarEventId(id: string, calendarEventId: string): Promise<void> {
    const { error } = await supabase.from("webinars").update({ calendar_event_id: calendarEventId }).eq("id", id);

    if (error) {
      throw new AppError(500, `Erreur mise à jour calendar_event_id: ${error.message}`);
    }
  }
}
