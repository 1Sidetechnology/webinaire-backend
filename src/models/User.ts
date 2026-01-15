import supabase from "../config/database";
import { User, CreateUserDTO } from "../types";
import { AppError } from "../middlewares/errorHandler";

/**
 * Modèle User - Gestion des utilisateurs
 */
export class UserModel {
  /**
   * Créer un nouvel utilisateur
   */
  static async create(userData: CreateUserDTO): Promise<User> {
    const { data, error } = await supabase.from("users").insert([userData]).select().single();

    if (error) {
      // Gérer le cas de l'email en double
      if (error.code === "23505") {
        throw new AppError(409, "Cet email est déjà utilisé");
      }
      throw new AppError(500, `Erreur création utilisateur: ${error.message}`);
    }

    return data;
  }

  /**
   * Trouver un utilisateur par email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single();

    if (error) {
      if (error.code === "PGRST116") return null; // Pas trouvé
      throw new AppError(500, `Erreur recherche utilisateur: ${error.message}`);
    }

    return data;
  }

  /**
   * Trouver un utilisateur par ID
   */
  static async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new AppError(500, `Erreur recherche utilisateur: ${error.message}`);
    }

    return data;
  }

  /**
   * Récupérer ou créer un utilisateur (upsert basé sur email)
   */
  static async findOrCreate(userData: CreateUserDTO): Promise<User> {
    // D'abord chercher l'utilisateur
    const existing = await this.findByEmail(userData.email);

    if (existing) {
      // Mettre à jour le nom et la company si fournis
      if (userData.name !== existing.name || userData.company !== existing.company) {
        const { data, error } = await supabase
          .from("users")
          .update({
            name: userData.name,
            company: userData.company,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) {
          throw new AppError(500, `Erreur mise à jour utilisateur: ${error.message}`);
        }
        return data;
      }
      return existing;
    }

    // Créer le nouvel utilisateur
    return this.create(userData);
  }

  /**
   * Lister tous les utilisateurs avec pagination
   */
  static async list(page: number = 1, limit: number = 50): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;

    // Compter le total
    const { count } = await supabase.from("users").select("*", { count: "exact", head: true });

    // Récupérer les utilisateurs
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(500, `Erreur récupération utilisateurs: ${error.message}`);
    }

    return {
      users: data || [],
      total: count || 0,
    };
  }

  /**
   * Supprimer un utilisateur
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      throw new AppError(500, `Erreur suppression utilisateur: ${error.message}`);
    }
  }
}
