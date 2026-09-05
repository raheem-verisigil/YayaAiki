import { describe, expect, it } from "vitest";
import { YAYAAIKI_CONTACTS, YAYAAIKI_PORTALS, YAYAAIKI_WORKFLOW_STAGES } from "../shared/yayaaiki";

describe("YayaAiki workflow foundation", () => {
  it("keeps the accountable work sequence ordered from brief to reputation", () => {
    expect(YAYAAIKI_WORKFLOW_STAGES.slice(0, 4)).toEqual([
      "WORK_ORDER_CREATED",
      "FUNDS_RESERVED",
      "ACTOR_ASSIGNED",
      "WORK_STARTED",
    ]);
    expect(YAYAAIKI_WORKFLOW_STAGES.indexOf("EVIDENCE_SUBMITTED")).toBeLessThan(
      YAYAAIKI_WORKFLOW_STAGES.indexOf("PAYMENT_AUTHORIZED"),
    );
    expect(YAYAAIKI_WORKFLOW_STAGES.at(-1)).toBe("CLOSED");
  });

  it("exposes all user-facing portal entry points", () => {
    expect(Object.values(YAYAAIKI_PORTALS)).toEqual(["/", "/for-business", "/for-professionals", "/ops"]);
  });

  it("keeps the public contact identity aligned with the brief", () => {
    expect(YAYAAIKI_CONTACTS.whatsapp).toBe("2348112051880");
    expect(YAYAAIKI_CONTACTS.hello).toBe("hello@yayaaiki.com");
    expect(YAYAAIKI_CONTACTS.business).toBe("business@yayaaiki.com");
    expect(YAYAAIKI_CONTACTS.work).toBe("work@yayaaiki.com");
    expect(YAYAAIKI_CONTACTS.support).toBe("support@yayaaiki.com");
  });
});
