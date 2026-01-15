// Types pour l'application de webinaires

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Webinar {
  id: string;
  title: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  price: number;
  max_participants: number;
  calendar_event_id?: string;
  status: "active" | "cancelled" | "completed";
  created_at: Date;
  updated_at: Date;
}

export interface Registration {
  id: string;
  user_id: string;
  webinar_id: string;
  payment_id?: string;
  status: "pending" | "confirmed" | "cancelled";
  meet_link?: string;
  calendar_event_id?: string;
  reminder_sent: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: string;
  registration_id: string;
  sumup_checkout_id?: string;
  sumup_transaction_id?: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  invoice_number?: string;
  invoice_pdf_url?: string;
  payment_date?: Date;
  created_at: Date;
  updated_at: Date;
}

// DTOs pour les requêtes
export interface CreateUserDTO {
  email: string;
  name: string;
  company?: string;
}

export interface CreateWebinarDTO {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  price: number;
  max_participants?: number;
}

export interface UpdateWebinarDTO {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  price?: number;
  max_participants?: number;
  status?: "active" | "cancelled" | "completed";
}

export interface CreateRegistrationDTO {
  webinar_id: string;
  user: CreateUserDTO;
}

// Types pour JWT
export interface JWTPayload {
  userId: string;
  email: string;
}

// Types pour SumUp
export interface SumUpCheckoutRequest {
  checkout_reference: string;
  amount: number;
  currency: string;
  merchant_code: string;
  description: string;
  return_url: string;
}

export interface SumUpCheckoutResponse {
  id: string;
  checkout_reference: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
}

export interface SumUpWebhookPayload {
  id: string;
  checkout_reference: string;
  amount: number;
  currency: string;
  status: string;
  transaction_id: string;
  timestamp: string;
}

// Types pour Google Calendar
export interface GoogleCalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees: Array<{ email: string }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: { type: string };
    };
  };
}

// Types pour les emails
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Extension de Request Express pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
