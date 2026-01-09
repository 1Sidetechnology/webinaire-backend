import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { WebinarModule } from "./webinar/webinar.module";
import { PaymentModule } from "./payment/payment.module";
import { EmailModule } from "./email/email.module";
import { CalendarModule } from "./calendar/calendar.module";

@Module({
  imports: [ScheduleModule.forRoot(), WebinarModule, PaymentModule, EmailModule, CalendarModule],
})
export class AppModule {}
