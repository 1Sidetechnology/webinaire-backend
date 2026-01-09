import { Module } from "@nestjs/common";
import { WebinarController } from "./webinar.controller";
import { WebinarService } from "./webinar.service";
import { SupabaseService } from "../database/supabase.service";

@Module({
  controllers: [WebinarController],
  providers: [WebinarService, SupabaseService],
  exports: [WebinarService],
})
export class WebinarModule {}
