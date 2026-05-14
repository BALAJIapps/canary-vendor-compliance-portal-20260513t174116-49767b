import { NextRequest } from 'next/server';
import { db } from '@/db';
import { canaryVendorDocument, canaryVendor, canaryNotification } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const documents = await db
      .select()
      .from(canaryVendorDocument)
      .orderBy(desc(canaryVendorDocument.createdAt));
    return Response.json({ ok: true, documents });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error(JSON.stringify({ level: 'error', route: 'GET /api/canary-vendor-documents', error: msg }));
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message: msg } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendor_id, document_name, document_url, document_type } = body;

    if (!vendor_id || !document_name || !document_url || !document_type) {
      return Response.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'vendor_id, document_name, document_url, and document_type are required' } },
        { status: 400 }
      );
    }

    // Verify vendor exists
    const vendor = await db
      .select()
      .from(canaryVendor)
      .where(eq(canaryVendor.id, vendor_id))
      .limit(1);

    if (vendor.length === 0) {
      return Response.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Vendor not found' } },
        { status: 404 }
      );
    }

    const [document] = await db
      .insert(canaryVendorDocument)
      .values({
        vendorId: vendor_id,
        documentName: document_name,
        documentUrl: document_url,
        documentType: document_type,
      })
      .returning();

    // Record notification for document upload
    await db.insert(canaryNotification).values({
      vendorId: vendor_id,
      type: 'document_uploaded',
      message: `Document "${document_name}" uploaded for vendor ${vendor[0].companyName}`,
      status: 'pending',
    });

    return Response.json({ ok: true, document }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error(JSON.stringify({ level: 'error', route: 'POST /api/canary-vendor-documents', error: msg }));
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message: msg } }, { status: 500 });
  }
}
