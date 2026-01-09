import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { WebinarService } from "./webinar.service";

@Controller("webinars")
export class WebinarController {
  constructor(private webinarService: WebinarService) {}

  @Get()
  async listWebinars() {
    // Implémenter liste publique
    return { message: "Liste des webinaires" };
  }

  @Get(":id")
  async getWebinar(@Param("id") id: string) {
    return this.webinarService.getWebinar(id);
  }

  @Get(":id/slots")
  async getAvailableSlots(@Param("id") id: string) {
    return this.webinarService.getAvailableSlots(id);
  }

  @Post("register")
  async register(@Body() body: any) {
    // Créer une registration en attente de paiement
    const registration = await this.webinarService.createRegistration({
      user_email: body.email,
      user_name: body.name,
      company_name: body.company,
      webinar_id: body.webinarId,
      slot_id: body.slotId,
      payment_status: "pending",
    });

    return {
      registrationId: registration.id,
      message: "Registration created, proceed to payment",
    };
  }
}
