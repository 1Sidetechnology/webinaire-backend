import { createClient, SupabaseClient } from "@supabase/supabase-js";
import env from "./env";

/**
 * Client Supabase configuré avec la clé de service
 * Utilisé pour toutes les opérations backend qui nécessitent
 * des permissions élevées (bypass RLS)
 */
export const supabase: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Helper pour gérer les erreurs Supabase
 */
export function handleSupabaseError(error: any): never {
  console.error("Erreur Supabase:", error);
  throw new Error(error.message || "Erreur base de données");
}

/**
 * Vérifier la connexion à Supabase
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("users").select("count").limit(1);
    if (error) {
      console.error("Erreur de connexion Supabase:", error);
      return false;
    }
    console.log("✅ Connexion Supabase établie");
    return true;
  } catch (error) {
    console.error("Erreur de connexion Supabase:", error);
    return false;
  }
}

export default supabase;
