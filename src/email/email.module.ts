import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { SupabaseService } from "../database/supabase.service";

@Module({
  controllers: [],
  providers: [EmailService, SupabaseService],
  exports: [EmailService],
})
export class EmailModule {}
