import { NextRequest } from "next/server";
import { db } from "@/db";
import { canaryVendor, canaryNotification } from "@/db/schema";
import { eq } from "drizzle-orm";

// NOTE: Canary endpoint — intentionally public per canary test contract.
// In production, this endpoint should require admin session.

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NOTE_LENGTH = 1000;
const VALID_ACTIONS = ["approved", "rejected"] as const;
type VendorAction = typeof VALID_ACTIONS[number];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return Response.json({ ok: false, error: "Invalid vendor ID format" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const review_note = body?.review_note
      ? String(body.review_note).slice(0, MAX_NOTE_LENGTH)
      : "";

    // Support explicit action field; default to approved
    const rawAction = body?.action ?? "approved";
    const action: VendorAction = VALID_ACTIONS.includes(rawAction as VendorAction)
      ? (rawAction as VendorAction)
      : "approved";

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
        status: action,
        reviewNote: review_note,
        reviewedBy: "admin",
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(canaryVendor.id, id))
      .returning();

    // Record approval/rejection notification
    await db.insert(canaryNotification).values({
      vendorId: id,
      type: `vendor_${action}`,
      message: `Vendor ${existing[0].companyName} has been ${action}. Note: ${review_note || "none"}`,
      status: "sent",
    });

    return Response.json({ ok: true, vendor: updated });
  } catch (err) {
    console.error("[canary-vendors approve POST]", err);
    return Response.json({ ok: false, error: "Failed to update vendor status" }, { status: 500 });
  }
}
