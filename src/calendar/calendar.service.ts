import { Injectable } from "@nestjs/common";
import { google } from "googleapis";

@Injectable()
export class CalendarService {
  private calendar: any;

  constructor() {
    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);

    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    this.calendar = google.calendar({ version: "v3", auth });
  }

  async createEvent(data: { summary: string; description: string; start: string; end: string; attendees: string[] }) {
    const event = {
      summary: data.summary,
      description: data.description,
      start: {
        dateTime: data.start,
        timeZone: "Europe/Monaco",
      },
      end: {
        dateTime: data.end,
        timeZone: "Europe/Monaco",
      },
      attendees: data.attendees.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // J-1
          { method: "popup", minutes: 60 },
        ],
      },
    };

    const response = await this.calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      sendUpdates: "all",
      resource: event,
    });

    return response.data;
  }
}
