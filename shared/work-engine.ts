export const WORK_ORDER_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "REVIEW",
  "READY",
  "FUNDED",
  "ASSIGNING",
  "ACTIVE",
  "SUBMITTED_FOR_VERIFICATION",
  "UNDER_VERIFICATION",
  "ACCEPTED",
  "REWORK",
  "PAYMENT_AUTHORIZED",
  "PAYMENT_PROCESSING",
  "PAYMENT_CONFIRMED",
  "COMPLETED",
  "DISPUTED",
  "CANCELLED",
] as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];
export type DataClass = "D0" | "D1" | "D2" | "D3" | "D4" | "D5";
export type AccessChannel = "WEB" | "WHATSAPP" | "VOICE" | "USSD" | "ASSISTED";

export interface WorkOrderRecord {
  workOrderId: string;
  tenantId: string;
  clientActorId: string;
  description: string;
  taskType: string;
  acceptanceCriteria: string[];
  deadline: number;
  priceMinor: number;
  currency: string;
  fundingStatus: "UNFUNDED" | "COMMITTED" | "CONFIRMED";
  riskClass: "LOW" | "MEDIUM" | "HIGH";
  jurisdiction: string;
  dataClass: DataClass;
  status: WorkOrderStatus;
  createdAt: number;
  expiresAt?: number;
}

export interface EvidenceRecord {
  evidenceId: string;
  workOrderId: string;
  actorId: string;
  artifactType: string;
  artifactLocation: string;
  hash: string;
  version: number;
  supersedes?: string;
  provenance: Record<string, string>;
  verificationStatus: "PENDING" | "PASSED" | "FAILED" | "REWORK";
}

export interface VerificationRecord {
  verificationId: string;
  evidenceId: string;
  verifierActorId: string;
  method: "HUMAN" | "RULE" | "AI_ASSISTED";
  decision: "PASS" | "FAIL" | "REWORK";
  reason: string;
  confidence?: number;
  policyVersion: string;
  timestamp: number;
}

export const WORK_ENGINE_CHANNELS: Record<AccessChannel, { label: string; availability: "now" | "roadmap" }> = {
  WEB: { label: "Web", availability: "now" },
  WHATSAPP: { label: "WhatsApp", availability: "now" },
  VOICE: { label: "Voice", availability: "roadmap" },
  USSD: { label: "USSD", availability: "roadmap" },
  ASSISTED: { label: "Human assistance", availability: "now" },
};
