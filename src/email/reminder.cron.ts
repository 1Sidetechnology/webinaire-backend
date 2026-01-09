import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { WebinarService } from "../webinar/webinar.service";
import { EmailService } from "./email.service";

@Injectable()
export class ReminderCron {
  constructor(private webinarService: WebinarService, private emailService: EmailService) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyReminders() {
    console.log("🔔 Checking for webinars in next 24h...");

    const upcomingWebinars = await this.webinarService.getUpcomingWebinars(24);

    for (const slot of upcomingWebinars) {
      for (const registration of slot.registrations) {
        if (registration.payment_status !== "completed") continue;

        await this.emailService.sendReminder({
          to: registration.user_email,
          userName: registration.user_name,
          webinarTitle: slot.webinars.title,
          webinarDate: slot.start_date,
          meetLink: slot.meet_link,
        });

        console.log(`✅ Reminder sent to ${registration.user_email}`);
      }
    }
  }
}
