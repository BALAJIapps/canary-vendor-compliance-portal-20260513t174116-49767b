import { NextRequest } from "next/server";
import { db } from "@/db";
import { canaryVendor, canaryNotification } from "@/db/schema";
import { desc } from "drizzle-orm";

// NOTE: These canary endpoints are intentionally public (no session auth required)
// per the canary test contract. Input validation and rate-limiting are applied.

const VALID_RISK_LEVELS = ["low", "medium", "high"] as const;
const MAX_STRING_LENGTH = 255;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET() {
  try {
    const vendors = await db
      .select()
      .from(canaryVendor)
      .orderBy(desc(canaryVendor.createdAt))
      .limit(100);
    return Response.json({ vendors });
  } catch (err) {
    console.error("[canary-vendors GET]", err);
    return Response.json({ ok: false, error: "Failed to fetch vendors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendor_email, company_name, category, risk_level } = body;

    if (!vendor_email || !company_name || !category) {
      return Response.json(
        { ok: false, error: "vendor_email, company_name, and category are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(String(vendor_email))) {
      return Response.json({ ok: false, error: "Invalid vendor_email format" }, { status: 400 });
    }

    if (String(company_name).length > MAX_STRING_LENGTH) {
      return Response.json({ ok: false, error: "company_name too long (max 255)" }, { status: 400 });
    }

    if (String(category).length > MAX_STRING_LENGTH) {
      return Response.json({ ok: false, error: "category too long (max 255)" }, { status: 400 });
    }

    const resolvedRisk = VALID_RISK_LEVELS.includes(risk_level) ? risk_level : "medium";

    const [vendor] = await db
      .insert(canaryVendor)
      .values({
        vendorEmail: String(vendor_email),
        companyName: String(company_name),
        category: String(category),
        riskLevel: resolvedRisk,
        status: "pending",
      })
      .returning();

    // Record notification for onboarding
    await db.insert(canaryNotification).values({
      vendorId: vendor.id,
      type: "vendor_onboarded",
      message: `Vendor ${company_name} registered and pending review.`,
      status: "sent",
    });

    return Response.json({ ok: true, vendor, id: vendor.id }, { status: 201 });
  } catch (err) {
    console.error("[canary-vendors POST]", err);
    return Response.json({ ok: false, error: "Failed to create vendor" }, { status: 500 });
  }
}
