import { NextRequest } from 'next/server';
import { db } from '@/db';
import { canaryVendor, canaryNotification } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { review_note, action } = body;
    const newStatus = action === 'reject' ? 'rejected' : 'approved';

    const existing = await db
      .select()
      .from(canaryVendor)
      .where(eq(canaryVendor.id, id))
      .limit(1);

    if (existing.length === 0) {
      return Response.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Vendor not found' } },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(canaryVendor)
      .set({
        status: newStatus,
        reviewNote: review_note ?? null,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(canaryVendor.id, id))
      .returning();

    // Record notification for approval/rejection
    await db.insert(canaryNotification).values({
      vendorId: id,
      type: `vendor_${newStatus}`,
      message: `Vendor ${existing[0].companyName} has been ${newStatus}. Note: ${review_note ?? 'No note'}`,
      status: 'sent',
    });

    return Response.json({ ok: true, vendor: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error(JSON.stringify({ level: 'error', route: 'POST /api/canary-vendors/[id]/approve', error: msg }));
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message: msg } }, { status: 500 });
  }
}
