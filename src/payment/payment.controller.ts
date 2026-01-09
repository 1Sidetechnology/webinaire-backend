import { Controller, Post, Body, Req, Res, HttpStatus } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { WebinarService } from "../webinar/webinar.service";
import { CalendarService } from "../calendar/calendar.service";
import { EmailService } from "../email/email.service";

@Controller("payment")
export class PaymentController {
  constructor(private paymentService: PaymentService, private webinarService: WebinarService, private calendarService: CalendarService, private emailService: EmailService) {}

  @Post("create-order")
  async createOrder(@Body() body: { registrationId: string; amount: number }) {
    const order = await this.paymentService.createOrder(body.amount, body.registrationId);
    return order;
  }

  @Post("webhook")
  async handleWebhook(@Req() req: any, @Res() res: any) {
    const verified = this.paymentService.verifyWebhookSignature(req.headers, req.body);

    if (!verified) {
      return res.status(HttpStatus.UNAUTHORIZED).send("Invalid signature");
    }

    const event = req.body;

    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const registrationId = event.resource.purchase_units[0].custom_id;
      const paymentId = event.resource.id;

      // 1. Mettre à jour la registration
      const registration = await this.webinarService.updateRegistration(registrationId, {
        payment_status: "completed",
        payment_id: paymentId,
        invoice_number: `INV-${Date.now()}`,
      });

      // 2. Récupérer les infos du slot et webinar
      const { data: slot } = await this.webinarService.getClient().from("webinar_slots").select("*, webinars(*)").eq("id", registration.slot_id).single();

      // 3. Créer l'événement Google Calendar + Meet
      const event = await this.calendarService.createEvent({
        summary: slot.webinars.title,
        description: slot.webinars.description,
        start: slot.start_date,
        end: slot.end_date,
        attendees: [registration.user_email],
      });

      // 4. Mettre à jour le slot avec le lien Meet
      await this.webinarService
        .getClient()
        .from("webinar_slots")
        .update({
          meet_link: event.hangoutLink,
          calendar_event_id: event.id,
        })
        .eq("id", slot.id);

      // 5. Générer et envoyer la facture par email
      await this.emailService.sendConfirmationWithInvoice({
        to: registration.user_email,
        userName: registration.user_name,
        webinarTitle: slot.webinars.title,
        webinarDate: slot.start_date,
        meetLink: event.hangoutLink,
        invoiceNumber: registration.invoice_number,
        amount: slot.webinars.price,
      });
    }

    return res.status(HttpStatus.OK).send("OK");
  }
}
