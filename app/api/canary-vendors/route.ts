import { NextRequest } from "next/server";
import { db } from "@/db";
import { canaryVendor, canaryNotification } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const vendors = await db
      .select()
      .from(canaryVendor)
      .orderBy(desc(canaryVendor.createdAt));
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

    const [vendor] = await db
      .insert(canaryVendor)
      .values({
        vendorEmail: vendor_email,
        companyName: company_name,
        category,
        riskLevel: risk_level ?? "medium",
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
