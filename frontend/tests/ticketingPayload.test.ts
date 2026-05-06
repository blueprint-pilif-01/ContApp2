import { describe, expect, it } from "vitest";
import {
  ticketUpdatePayload,
  type Ticket,
} from "../src/app/pages/ticketing/TicketingPage";

describe("ticket payload", () => {
  it("does not include client_id for internal-only ticketing", () => {
    const ticket: Ticket = {
      id: 1,
      title: "Initial",
      description: "desc",
      status: "todo",
      priority: "normal",
      assignee_id: null,
      client_id: 99,
      owner_id: 2,
      due_date: "2026-05-05T12:00:00.000Z",
      source: "manual",
      updated_at: "2026-05-05T12:00:00.000Z",
    };

    expect(ticketUpdatePayload(ticket, { title: "Updated" })).not.toHaveProperty("client_id");
  });
});
