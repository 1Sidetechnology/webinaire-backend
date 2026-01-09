import { Module } from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import { SupabaseService } from "../database/supabase.service";

@Module({
  controllers: [],
  providers: [CalendarService, SupabaseService],
  exports: [CalendarService],
})
export class CalendarModule {}
