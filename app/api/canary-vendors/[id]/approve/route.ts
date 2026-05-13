import { NextRequest } from "next/server";
import { db } from "@/db";
import { canaryVendor, canaryNotification } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const review_note = body?.review_note ?? "";

    const existing = await db
      .select()
      .from(canaryVendor)
      .where(eq(canaryVendor.id, id))
      .limit(1);

    if (!existing.length) {
      return Response.json({ ok: false, error: "Vendor not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(canaryVendor)
      .set({
        status: "approved",
        reviewNote: review_note,
        reviewedBy: "admin",
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(canaryVendor.id, id))
      .returning();

    // Record approval notification
    await db.insert(canaryNotification).values({
      vendorId: id,
      type: "vendor_approved",
      message: `Vendor ${existing[0].companyName} has been approved. Note: ${review_note}`,
      status: "sent",
    });

    return Response.json({ ok: true, vendor: updated });
  } catch (err) {
    console.error("[canary-vendors approve POST]", err);
    return Response.json({ ok: false, error: "Failed to approve vendor" }, { status: 500 });
  }
}
