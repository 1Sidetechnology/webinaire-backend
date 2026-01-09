import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../database/supabase.service";

export interface Webinar {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_minutes: number;
  max_participants?: number;
  created_at?: string;
}

export interface WebinarSlot {
  id: string;
  webinar_id: string;
  start_date: string;
  end_date: string;
  available_slots: number;
  meet_link?: string;
  calendar_event_id?: string;
}

export interface Registration {
  id: string;
  user_email: string;
  user_name: string;
  company_name?: string;
  webinar_id: string;
  slot_id: string;
  payment_status: string;
  payment_id?: string;
  invoice_number?: string;
  created_at?: string;
}

@Injectable()
export class WebinarService {
  constructor(private supabase: SupabaseService) {}

  async createWebinar(data: Partial<Webinar>) {
    const { data: webinar, error } = await this.supabase.getClient().from("webinars").insert(data).select().single();

    if (error) throw error;
    return webinar;
  }

  async getWebinar(id: string) {
    const { data, error } = await this.supabase.getClient().from("webinars").select("*").eq("id", id).single();

    if (error) throw error;
    return data;
  }

  async getAvailableSlots(webinarId: string) {
    const { data, error } = await this.supabase.getClient().from("webinar_slots").select("*").eq("webinar_id", webinarId).gt("available_slots", 0).gte("start_date", new Date().toISOString()).order("start_date", { ascending: true });

    if (error) throw error;
    return data;
  }

  async createRegistration(data: Partial<Registration>) {
    const { data: registration, error } = await this.supabase.getClient().from("registrations").insert(data).select().single();

    if (error) throw error;
    return registration;
  }

  async updateRegistration(id: string, data: Partial<Registration>) {
    const { data: updated, error } = await this.supabase.getClient().from("registrations").update(data).eq("id", id).select().single();

    if (error) throw error;
    return updated;
  }

  async getRegistrationsBySlot(slotId: string) {
    const { data, error } = await this.supabase.getClient().from("registrations").select("*").eq("slot_id", slotId).eq("payment_status", "completed");

    if (error) throw error;
    return data;
  }

  async getUpcomingWebinars(hours: number = 24) {
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      .getClient()
      .from("webinar_slots")
      .select(
        `
        *,
        webinars(*),
        registrations(*)
      `
      )
      .gte("start_date", now.toISOString())
      .lte("start_date", future.toISOString());

    if (error) throw error;
    return data;
  }
}
