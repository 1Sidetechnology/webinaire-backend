import cron from "node-cron";
import { RegistrationModel } from "../models/Registration";
import { EmailService } from "../services/email.service";

/**
 * Cron Job pour envoyer les rappels J-1
 * S'exécute tous les jours à 9h00
 */
export function initReminderJob(): void {
  // Cron pattern: '0 9 * * *' = tous les jours à 9h00
  cron.schedule("0 9 * * *", async () => {
    console.log("🔔 Démarrage du job de rappels J-1...");

    try {
      // Récupérer toutes les inscriptions nécessitant un rappel
      const registrations = await RegistrationModel.getRegistrationsNeedingReminder();

      console.log(`📧 ${registrations.length} rappel(s) à envoyer`);

      // Envoyer les rappels
      for (const registration of registrations) {
        try {
          await EmailService.sendWebinarReminder({
            to: registration.user.email,
            userName: registration.user.name,
            webinarTitle: registration.webinar.title,
            webinarDate: new Date(registration.webinar.start_date),
            meetLink: registration.meet_link,
          });

          // Marquer le rappel comme envoyé
          await RegistrationModel.markReminderSent(registration.id);

          console.log(`✅ Rappel envoyé à ${registration.user.email}`);
        } catch (error) {
          console.error(`❌ Erreur envoi rappel pour ${registration.user.email}:`, error);
          // On continue malgré l'erreur pour ne pas bloquer les autres
        }
      }

      console.log("✅ Job de rappels terminé");
    } catch (error) {
      console.error("❌ Erreur dans le job de rappels:", error);
    }
  });

  console.log("✅ Job de rappels J-1 initialisé (tous les jours à 9h00)");
}

/**
 * Job manuel pour tester
 * À utiliser uniquement en développement
 */
export async function sendRemindersNow(): Promise<void> {
  console.log("🔔 Envoi manuel des rappels...");

  try {
    const registrations = await RegistrationModel.getRegistrationsNeedingReminder();

    for (const registration of registrations) {
      await EmailService.sendWebinarReminder({
        to: registration.user.email,
        userName: registration.user.name,
        webinarTitle: registration.webinar.title,
        webinarDate: new Date(registration.webinar.start_date),
        meetLink: registration.meet_link,
      });

      await RegistrationModel.markReminderSent(registration.id);
      console.log(`✅ Rappel envoyé à ${registration.user.email}`);
    }

    console.log("✅ Envoi manuel terminé");
  } catch (error) {
    console.error("❌ Erreur envoi manuel:", error);
    throw error;
  }
}
