import jwt, { SignOptions } from "jsonwebtoken";
import env from "./env";
import { JWTPayload } from "../types";

/**
 * Génère un token JWT pour un utilisateur
 * @param payload - Données à encoder dans le token
 * @returns Token JWT signé
 */
export function generateToken(payload: JWTPayload): string {
  const options: SignOptions = {
    expiresIn: parseInt(env.JWT_EXPIRES_IN, 10),
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

/**
 * Vérifie et décode un token JWT
 * @param token - Token à vérifier
 * @returns Payload décodé ou null si invalide
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Erreur vérification JWT:", error);
    return null;
  }
}

/**
 * Extrait le token du header Authorization
 * @param authHeader - Header Authorization (format: "Bearer TOKEN")
 * @returns Token extrait ou null
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
