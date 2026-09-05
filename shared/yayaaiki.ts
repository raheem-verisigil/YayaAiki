export const YAYAAIKI_WORKFLOW_STAGES = [
  "WORK_ORDER_CREATED",
  "FUNDS_RESERVED",
  "ACTOR_ASSIGNED",
  "WORK_STARTED",
  "EVIDENCE_SUBMITTED",
  "VERIFICATION_PASSED",
  "PAYMENT_AUTHORIZED",
  "PAYMENT_CONFIRMED",
  "REPUTATION_UPDATED",
  "CLOSED",
] as const;

export const YAYAAIKI_PORTALS = {
  public: "/",
  business: "/for-business",
  professional: "/for-professionals",
  operations: "/ops",
} as const;

export const YAYAAIKI_CONTACTS = {
  whatsapp: "2348112051880",
  hello: "hello@yayaaiki.com",
  business: "business@yayaaiki.com",
  work: "work@yayaaiki.com",
  support: "support@yayaaiki.com",
} as const;
