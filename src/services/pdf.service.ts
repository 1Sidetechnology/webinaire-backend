import PDFDocument from "pdfkit";
import env from "../config/env";

/**
 * Service PDF - Génération de factures
 */
export class PDFService {
  /**
   * Générer une facture PDF
   * @returns Buffer du PDF généré
   */
  static async generateInvoice(data: { invoiceNumber: string; invoiceDate: Date; customerName: string; customerEmail: string; customerCompany?: string; webinarTitle: string; webinarDate: Date; amount: number; paymentMethod: string }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
        });

        const chunks: Buffer[] = [];

        // Collecter les chunks du PDF
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // En-tête de la facture
        doc
          .fontSize(20)
          .text("FACTURE", 50, 50, { align: "right" })
          .fontSize(10)
          .text(`N° ${data.invoiceNumber}`, { align: "right" })
          .text(`Date : ${new Intl.DateTimeFormat("fr-FR").format(data.invoiceDate)}`, { align: "right" })
          .moveDown(2);

        // Informations de l'entreprise
        doc.fontSize(12).font("Helvetica-Bold").text(env.COMPANY_NAME, 50, 120).font("Helvetica").fontSize(10).text(env.COMPANY_ADDRESS).text(`SIRET : ${env.COMPANY_SIRET}`).text(`TVA : ${env.COMPANY_VAT}`).moveDown(2);

        // Informations du client
        doc.font("Helvetica-Bold").fontSize(10).text("FACTURÉ À :", 50, 220).font("Helvetica").text(data.customerName).text(data.customerEmail);

        if (data.customerCompany) {
          doc.text(data.customerCompany);
        }

        doc.moveDown(2);

        // Ligne de séparation
        doc.moveTo(50, 300).lineTo(550, 300).stroke();

        // Tableau des prestations
        const tableTop = 320;
        doc.font("Helvetica-Bold").fontSize(10).text("Description", 50, tableTop).text("Date", 300, tableTop).text("Montant", 450, tableTop, { align: "right" });

        doc
          .moveTo(50, tableTop + 15)
          .lineTo(550, tableTop + 15)
          .stroke();

        // Détails du webinaire
        const itemY = tableTop + 25;
        doc
          .font("Helvetica")
          .text(`Inscription au webinaire :`, 50, itemY)
          .text(`"${data.webinarTitle}"`, 50, itemY + 15)
          .text(
            new Intl.DateTimeFormat("fr-FR", {
              dateStyle: "long",
              timeStyle: "short",
            }).format(data.webinarDate),
            300,
            itemY
          )
          .text(`${data.amount.toFixed(2)} €`, 450, itemY, { align: "right" });

        // Ligne de séparation
        doc
          .moveTo(50, itemY + 50)
          .lineTo(550, itemY + 50)
          .stroke();

        // Total
        const totalY = itemY + 70;
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .text("TOTAL TTC", 350, totalY)
          .text(`${data.amount.toFixed(2)} €`, 450, totalY, { align: "right" });

        // TVA non applicable si auto-entrepreneur
        doc
          .font("Helvetica")
          .fontSize(8)
          .text("TVA non applicable, art. 293 B du CGI", 50, totalY + 30, { align: "center" });

        // Informations de paiement
        doc.fontSize(10).moveDown(3).text(`Mode de paiement : ${data.paymentMethod}`).text("Paiement reçu - Aucune action requise");

        // Mentions légales en bas de page
        doc.fontSize(8).text("Cette facture est un document officiel. Merci de la conserver.", 50, 700, { align: "center", width: 500 }).text(`${env.COMPANY_NAME} - ${env.COMPANY_ADDRESS}`, { align: "center" }).text(`SIRET : ${env.COMPANY_SIRET} - TVA : ${env.COMPANY_VAT}`, { align: "center" });

        // Finaliser le PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Générer une facture simplifiée (reçu)
   */
  static async generateReceipt(data: { receiptNumber: string; date: Date; customerName: string; description: string; amount: number }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
        });

        const chunks: Buffer[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // En-tête
        doc.fontSize(24).text("REÇU DE PAIEMENT", { align: "center" }).moveDown(2);

        // Informations
        doc
          .fontSize(12)
          .text(`Reçu N° : ${data.receiptNumber}`)
          .text(`Date : ${new Intl.DateTimeFormat("fr-FR").format(data.date)}`)
          .moveDown()
          .text(`Reçu de : ${data.customerName}`)
          .moveDown()
          .text(`Pour : ${data.description}`)
          .moveDown()
          .fontSize(16)
          .text(`Montant : ${data.amount.toFixed(2)} €`, { align: "center" });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default PDFService;
