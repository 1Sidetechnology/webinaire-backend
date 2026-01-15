import { google } from "googleapis";
import env from "../config/env";
import { AppError } from "../middlewares/errorHandler";
import { GoogleCalendarEvent } from "../types";

/**
 * Service Google - Gestion de Google Calendar et Meet
 */
export class GoogleService {
  private static oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);

  private static calendar = google.calendar({
    version: "v3",
    auth: this.oauth2Client,
  });

  /**
   * Initialiser l'authentification OAuth2
   * Doit être appelé au démarrage de l'application
   */
  static initialize(): void {
    this.oauth2Client.setCredentials({
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
    });
    console.log("✅ Service Google Calendar initialisé");
  }

  /**
   * Créer un événement Google Calendar avec Google Meet
   * @param webinarInfo - Informations sur le webinaire
   * @param attendeeEmail - Email du participant
   * @returns Event ID et lien Google Meet
   */
  static async createEvent(
    webinarInfo: {
      title: string;
      description: string;
      startDate: Date;
      endDate: Date;
    },
    attendeeEmail: string
  ): Promise<{ eventId: string; meetLink: string }> {
    try {
      const event: GoogleCalendarEvent = {
        summary: webinarInfo.title,
        description: webinarInfo.description,
        start: {
          dateTime: webinarInfo.startDate.toISOString(),
          timeZone: "Europe/Paris", // Ajustez selon votre fuseau horaire
        },
        end: {
          dateTime: webinarInfo.endDate.toISOString(),
          timeZone: "Europe/Paris",
        },
        attendees: [{ email: attendeeEmail }],
        // Configuration pour créer automatiquement un lien Google Meet
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: env.GOOGLE_CALENDAR_ID,
        requestBody: event,
        conferenceDataVersion: 1, // Nécessaire pour créer le Meet
        sendUpdates: "all", // Envoyer les invitations par email
      });

      const eventId = response.data.id;
      const meetLink = response.data.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri;

      if (!eventId || !meetLink) {
        throw new Error("Impossible de créer l'événement ou le lien Meet");
      }

      console.log("✅ Événement Google Calendar créé:", eventId);
      console.log("📹 Lien Google Meet:", meetLink);

      return {
        eventId,
        meetLink,
      };
    } catch (error: any) {
      console.error("❌ Erreur création événement Google:", error.message);
      throw new AppError(500, "Erreur lors de la création de l'événement Google Calendar");
    }
  }

  /**
   * Mettre à jour un événement existant
   * @param eventId - ID de l'événement
   * @param updates - Données à mettre à jour
   */
  static async updateEvent(eventId: string, updates: Partial<GoogleCalendarEvent>): Promise<void> {
    try {
      await this.calendar.events.patch({
        calendarId: env.GOOGLE_CALENDAR_ID,
        eventId: eventId,
        requestBody: updates,
        sendUpdates: "all",
      });

      console.log("✅ Événement mis à jour:", eventId);
    } catch (error: any) {
      console.error("❌ Erreur mise à jour événement:", error.message);
      throw new AppError(500, "Erreur lors de la mise à jour de l'événement");
    }
  }

  /**
   * Supprimer un événement
   * @param eventId - ID de l'événement à supprimer
   */
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: env.GOOGLE_CALENDAR_ID,
        eventId: eventId,
        sendUpdates: "all",
      });

      console.log("✅ Événement supprimé:", eventId);
    } catch (error: any) {
      console.error("❌ Erreur suppression événement:", error.message);
      throw new AppError(500, "Erreur lors de la suppression de l'événement");
    }
  }

  /**
   * Récupérer les détails d'un événement
   * @param eventId - ID de l'événement
   * @returns Détails de l'événement
   */
  static async getEvent(eventId: string): Promise<any> {
    try {
      const response = await this.calendar.events.get({
        calendarId: env.GOOGLE_CALENDAR_ID,
        eventId: eventId,
      });

      return response.data;
    } catch (error: any) {
      console.error("❌ Erreur récupération événement:", error.message);
      throw new AppError(500, "Erreur lors de la récupération de l'événement");
    }
  }

  /**
   * Ajouter un participant à un événement existant
   * @param eventId - ID de l'événement
   * @param attendeeEmail - Email du participant à ajouter
   */
  static async addAttendee(eventId: string, attendeeEmail: string): Promise<void> {
    try {
      const event = await this.getEvent(eventId);
      const attendees = event.attendees || [];

      // Vérifier si le participant n'est pas déjà ajouté
      if (!attendees.find((a: any) => a.email === attendeeEmail)) {
        attendees.push({ email: attendeeEmail });

        await this.calendar.events.patch({
          calendarId: env.GOOGLE_CALENDAR_ID,
          eventId: eventId,
          requestBody: { attendees },
          sendUpdates: "all",
        });

        console.log("✅ Participant ajouté:", attendeeEmail);
      }
    } catch (error: any) {
      console.error("❌ Erreur ajout participant:", error.message);
      throw new AppError(500, "Erreur lors de l'ajout du participant");
    }
  }

  /**
   * Retirer un participant d'un événement
   * @param eventId - ID de l'événement
   * @param attendeeEmail - Email du participant à retirer
   */
  static async removeAttendee(eventId: string, attendeeEmail: string): Promise<void> {
    try {
      const event = await this.getEvent(eventId);
      const attendees = (event.attendees || []).filter((a: any) => a.email !== attendeeEmail);

      await this.calendar.events.patch({
        calendarId: env.GOOGLE_CALENDAR_ID,
        eventId: eventId,
        requestBody: { attendees },
        sendUpdates: "all",
      });

      console.log("✅ Participant retiré:", attendeeEmail);
    } catch (error: any) {
      console.error("❌ Erreur retrait participant:", error.message);
      throw new AppError(500, "Erreur lors du retrait du participant");
    }
  }
}

export default GoogleService;
