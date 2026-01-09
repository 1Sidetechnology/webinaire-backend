import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import * as PDFDocument from "pdfkit";

@Injectable()
export class EmailService {
  private transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.ZOHO_SMTP_HOST,
      port: parseInt(process.env.ZOHO_SMTP_PORT!),
      secure: true,
      auth: {
        user: process.env.ZOHO_SMTP_USER,
        pass: process.env.ZOHO_SMTP_PASS,
      },
    });
  }

  async generateInvoicePDF(data: { invoiceNumber: string; userName: string; company?: string; webinarTitle: string; amount: number; date: string }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(20).text("FACTURE", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Numéro: ${data.invoiceNumber}`);
      doc.text(`Date: ${new Date(data.date).toLocaleDateString("fr-FR")}`);
      doc.moveDown();
      doc.text(`Client: ${data.userName}`);
      if (data.company) doc.text(`Société: ${data.company}`);
      doc.moveDown();
      doc.text(`Webinaire: ${data.webinarTitle}`);
      doc.text(`Montant: ${data.amount.toFixed(2)} EUR`);
      doc.moveDown();
      doc.fontSize(10).text("Merci de votre confiance !");

      doc.end();
    });
  }

  async sendConfirmationWithInvoice(data: { to: string; userName: string; webinarTitle: string; webinarDate: string; meetLink: string; invoiceNumber: string; amount: number }) {
    const pdfBuffer = await this.generateInvoicePDF({
      invoiceNumber: data.invoiceNumber,
      userName: data.userName,
      webinarTitle: data.webinarTitle,
      amount: data.amount,
      date: data.webinarDate,
    });

    await this.transporter.sendMail({
      from: process.env.ZOHO_SMTP_USER,
      to: data.to,
      subject: `Confirmation - ${data.webinarTitle}`,
      html: `
        <h2>Inscription confirmée !</h2>
        <p>Bonjour ${data.userName},</p>
        <p>Votre inscription au webinaire <strong>${data.webinarTitle}</strong> est confirmée.</p>
        <p><strong>Date:</strong> ${new Date(data.webinarDate).toLocaleString("fr-FR")}</p>
        <p><strong>Lien Google Meet:</strong> <a href="${data.meetLink}">${data.meetLink}</a></p>
        <p>Vous recevrez un rappel 24h avant le webinaire.</p>
        <p>Facture en pièce jointe.</p>
      `,
      attachments: [
        {
          filename: `facture-${data.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
  }

  async sendReminder(data: { to: string; userName: string; webinarTitle: string; webinarDate: string; meetLink: string }) {
    await this.transporter.sendMail({
      from: process.env.ZOHO_SMTP_USER,
      to: data.to,
      subject: `[Rappel] ${data.webinarTitle} - Demain`,
      html: `
        <h2>Rappel : votre webinaire est demain !</h2>
        <p>Bonjour ${data.userName},</p>
        <p>Nous vous rappelons que le webinaire <strong>${data.webinarTitle}</strong> aura lieu demain.</p>
        <p><strong>Date:</strong> ${new Date(data.webinarDate).toLocaleString("fr-FR")}</p>
        <p><strong>Lien Google Meet:</strong> <a href="${data.meetLink}">${data.meetLink}</a></p>
        <p>À très bientôt !</p>
      `,
    });
  }
}
