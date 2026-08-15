import { describe, it, expect } from "vitest";
import { briefSchema, STEP_FIELDS, TOTAL_STEPS } from "@/lib/brief-schema";

const validBrief = {
  fullName: "Nino Kapanadze",
  company: "AOM",
  email: "nino@aom.ge",
  phone: "",
  countryCity: "Tbilisi, Georgia",
  projectType: "commercial-campaign",
  requiredServices: ["photography", "creative-direction"],
  description: "A summer campaign for a fashion brand shooting in Tbilisi.",
  audience: "",
  references: "",
  preferredDate: "September 2026",
  deadline: "",
  location: "",
  shootType: "both",
  productionDays: "2",
  budget: "medium",
  deliverables: ["campaign-photography"],
  channels: "",
  formats: "",
  files: [],
  notes: "",
  referral: "",
  consent: true,
};

describe("brief schema", () => {
  it("accepts a complete valid brief", () => {
    expect(briefSchema.safeParse(validBrief).success).toBe(true);
  });

  it("rejects an incomplete email", () => {
    const r = briefSchema.safeParse({ ...validBrief, email: "nino.kapanadze@" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === "email")).toBe(true);
  });

  it("requires a full name of at least 2 characters", () => {
    const r = briefSchema.safeParse({ ...validBrief, fullName: "N" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === "minName")).toBe(true);
  });

  it("requires a project type", () => {
    const r = briefSchema.safeParse({ ...validBrief, projectType: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === "projectType")).toBe(true);
  });

  it("requires consent to be true", () => {
    const r = briefSchema.safeParse({ ...validBrief, consent: false });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === "consent")).toBe(true);
  });

  it("maps all schema fields across exactly 5 steps", () => {
    expect(TOTAL_STEPS).toBe(5);
    const covered = STEP_FIELDS.flat();
    expect(covered).toContain("email");
    expect(covered).toContain("consent");
    expect(new Set(covered).size).toBe(covered.length);
  });
});
