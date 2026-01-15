import nodemailer, { Transporter } from "nodemailer";
import env from "../config/env";
import { AppError } from "../middlewares/errorHandler";
import { EmailOptions } from "../types";

/**
 * Service Email - Gestion de l'envoi d'emails via SMTP Zoho
 */
export class EmailService {
  private static transporter: Transporter;

  /**
   * Initialiser le transporter nodemailer
   */
  static initialize(): void {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE, // false pour port 587
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });

    console.log("✅ Service Email initialisé (Zoho SMTP)");
  }

  /**
   * Vérifier la connexion SMTP
   */
  static async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("✅ Connexion SMTP vérifiée");
      return true;
    } catch (error) {
      console.error("❌ Erreur connexion SMTP:", error);
      return false;
    }
  }

  /**
   * Envoyer un email générique
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      });

      console.log("✅ Email envoyé à:", options.to);
    } catch (error: any) {
      console.error("❌ Erreur envoi email:", error.message);
      throw new AppError(500, "Erreur lors de l'envoi de l'email");
    }
  }

  /**
   * Email de confirmation d'inscription
   */
  static async sendRegistrationConfirmation(data: { to: string; userName: string; webinarTitle: string; webinarDate: Date; meetLink: string; invoiceBuffer?: Buffer }): Promise<void> {
    const formattedDate = new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Europe/Paris",
    }).format(data.webinarDate);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 20px 0;
          }
          .info-box { 
            background: white; 
            padding: 15px; 
            border-left: 4px solid #4CAF50; 
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Inscription confirmée !</h1>
          </div>
          <div class="content">
            <p>Bonjour ${data.userName},</p>
            
            <p>Votre inscription au webinaire <strong>"${data.webinarTitle}"</strong> a été confirmée avec succès.</p>
            
            <div class="info-box">
              <h3>📅 Détails du webinaire</h3>
              <p><strong>Date :</strong> ${formattedDate}</p>
              <p><strong>Titre :</strong> ${data.webinarTitle}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.meetLink}" class="button">
                🎥 Rejoindre le webinaire
              </a>
            </div>
            
            <p><strong>Lien Google Meet :</strong><br>
            <a href="${data.meetLink}">${data.meetLink}</a></p>
            
            <p>⏰ Vous recevrez un rappel par email 24h avant le début du webinaire.</p>
            
            ${data.invoiceBuffer ? "<p>📄 Vous trouverez votre facture en pièce jointe.</p>" : ""}
            
            <p>À bientôt !<br>
            L'équipe ${env.COMPANY_NAME}</p>
          </div>
          <div class="footer">
            <p>${env.COMPANY_NAME} | ${env.COMPANY_ADDRESS}</p>
            <p>SIRET: ${env.COMPANY_SIRET} | TVA: ${env.COMPANY_VAT}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = data.invoiceBuffer
      ? [
          {
            filename: "facture.pdf",
            content: data.invoiceBuffer,
            contentType: "application/pdf",
          },
        ]
      : undefined;

    await this.sendEmail({
      to: data.to,
      subject: `Confirmation d'inscription - ${data.webinarTitle}`,
      html,
      attachments,
    });
  }

  /**
   * Email de rappel J-1
   */
  static async sendWebinarReminder(data: { to: string; userName: string; webinarTitle: string; webinarDate: Date; meetLink: string }): Promise<void> {
    const formattedDate = new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Europe/Paris",
    }).format(data.webinarDate);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #FF9800; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 20px 0;
          }
          .alert-box { 
            background: #FFF3CD; 
            padding: 15px; 
            border-left: 4px solid #FF9800; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Rappel : Votre webinaire commence demain !</h1>
          </div>
          <div class="content">
            <p>Bonjour ${data.userName},</p>
            
            <div class="alert-box">
              <p><strong>🔔 Le webinaire "${data.webinarTitle}" commence demain !</strong></p>
              <p><strong>Date :</strong> ${formattedDate}</p>
            </div>
            
            <p>N'oubliez pas de vous connecter quelques minutes à l'avance pour tester votre connexion.</p>
            
            <div style="text-align: center;">
              <a href="${data.meetLink}" class="button">
                🎥 Rejoindre le webinaire
              </a>
            </div>
            
            <p><strong>Lien Google Meet :</strong><br>
            <a href="${data.meetLink}">${data.meetLink}</a></p>
            
            <p>À très bientôt !<br>
            L'équipe ${env.COMPANY_NAME}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.to,
      subject: `Rappel : ${data.webinarTitle} - Demain !`,
      html,
    });
  }

  /**
   * Email d'annulation
   */
  static async sendCancellationEmail(data: { to: string; userName: string; webinarTitle: string; reason?: string }): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Annulation de webinaire</h1>
          </div>
          <div class="content">
            <p>Bonjour ${data.userName},</p>
            
            <p>Nous sommes au regret de vous informer que le webinaire <strong>"${data.webinarTitle}"</strong> a été annulé.</p>
            
            ${data.reason ? `<p><strong>Raison :</strong> ${data.reason}</p>` : ""}
            
            <p>Nous vous contacterons prochainement pour vous proposer une nouvelle date ou un remboursement.</p>
            
            <p>Toutes nos excuses pour ce désagrément.</p>
            
            <p>Cordialement,<br>
            L'équipe ${env.COMPANY_NAME}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.to,
      subject: `Annulation - ${data.webinarTitle}`,
      html,
    });
  }
}

export default EmailService;
