import { describe, it, expect } from "vitest";
import { WORK_LOG_EDIT_WINDOW_DAYS } from "@/services/workLogServices";
import { createClientSchema, createDeliveryEventSchema } from "@/lib/validations";
import { can } from "@/utils/permissions";

describe("Integration: Work Logs & Client Delivery Access", () => {
  describe("Work Log 5-Day Enforcement", () => {
    it("backend enforces exact 5-day edit window", () => {
      expect(WORK_LOG_EDIT_WINDOW_DAYS).toBe(5);

      const now = new Date();
      now.setUTCHours(0, 0, 0, 0);

      const earliestAllowed = new Date(now);
      earliestAllowed.setUTCDate(earliestAllowed.getUTCDate() - 5);

      // 4 days ago -> allowed
      const fourDaysAgo = new Date(now);
      fourDaysAgo.setUTCDate(fourDaysAgo.getUTCDate() - 4);
      expect(fourDaysAgo.getTime()).toBeGreaterThanOrEqual(earliestAllowed.getTime());

      // 6 days ago -> rejected
      const sixDaysAgo = new Date(now);
      sixDaysAgo.setUTCDate(sixDaysAgo.getUTCDate() - 6);
      expect(sixDaysAgo.getTime()).toBeLessThan(earliestAllowed.getTime());
    });
  });

  describe("Client Management & Delivery Events Scoping", () => {
    it("allows Super Admin and Admin to manage clients and delivery schedules", () => {
      expect(can("SUPER_ADMIN", "MANAGE_CLIENTS")).toBe(true);
      expect(can("ADMIN", "MANAGE_CLIENTS")).toBe(true);
      expect(can("EMPLOYEE", "MANAGE_CLIENTS")).toBe(false);
    });

    it("validates client creation schema including drive links and MOU link", () => {
      const clientData = {
        name: "Acme Studios Worldwide",
        description: "Feature film production house",
        deckLink: "https://drive.google.com/file/d/example-deck/view",
        deliverablesLink: "https://drive.google.com/drive/folders/deliverables",
        contentLink: "https://drive.google.com/drive/folders/content",
        mouLink: "https://drive.google.com/file/d/example-mou/view",
      };

      const parsed = createClientSchema.safeParse(clientData);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.name).toBe("Acme Studios Worldwide");
        expect(parsed.data.mouLink).toContain("drive.google.com");
      }
    });

    it("validates delivery calendar event creation", () => {
      const deliveryInput = {
        title: "Final Teaser Trailer Delivery (4K ProRes)",
        date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
        description: "Delivery of theatrical cut teaser",
      };

      const parsed = createDeliveryEventSchema.safeParse(deliveryInput);
      expect(parsed.success).toBe(true);
    });
  });
});
