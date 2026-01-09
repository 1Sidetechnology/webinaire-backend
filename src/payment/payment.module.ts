import { Module } from "@nestjs/common";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { SupabaseService } from "../database/supabase.service";

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, SupabaseService],
  exports: [PaymentService],
})
export class PaymentModule {}
