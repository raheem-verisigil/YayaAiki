import { describe, expect, it } from "vitest";
import { WORK_ENGINE_CHANNELS, WORK_ORDER_STATUSES } from "../shared/work-engine";

describe("Work Engine foundation", () => {
  it("keeps provider confirmation after authorization and before completion", () => {
    expect(WORK_ORDER_STATUSES.indexOf("PAYMENT_AUTHORIZED")).toBeLessThan(WORK_ORDER_STATUSES.indexOf("PAYMENT_CONFIRMED"));
    expect(WORK_ORDER_STATUSES.indexOf("PAYMENT_CONFIRMED")).toBeLessThan(WORK_ORDER_STATUSES.indexOf("COMPLETED"));
  });

  it("keeps WhatsApp and web live while future channels remain explicitly roadmap", () => {
    expect(WORK_ENGINE_CHANNELS.WEB.availability).toBe("now");
    expect(WORK_ENGINE_CHANNELS.WHATSAPP.availability).toBe("now");
    expect(WORK_ENGINE_CHANNELS.VOICE.availability).toBe("roadmap");
    expect(WORK_ENGINE_CHANNELS.USSD.availability).toBe("roadmap");
  });
});
