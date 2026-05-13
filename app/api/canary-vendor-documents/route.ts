import { NextRequest } from "next/server";
import { db } from "@/db";
import { canaryVendorDocument, canaryVendor, canaryNotification } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const documents = await db
      .select()
      .from(canaryVendorDocument)
      .orderBy(desc(canaryVendorDocument.createdAt));
    return Response.json({ documents });
  } catch (err) {
    console.error("[canary-vendor-documents GET]", err);
    return Response.json({ ok: false, error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendor_id, document_name, document_url, document_type } = body;

    if (!vendor_id || !document_name || !document_url || !document_type) {
      return Response.json(
        { ok: false, error: "vendor_id, document_name, document_url, and document_type are required" },
        { status: 400 }
      );
    }

    // Verify vendor exists
    const vendors = await db
      .select()
      .from(canaryVendor)
      .where(eq(canaryVendor.id, vendor_id))
      .limit(1);

    if (!vendors.length) {
      return Response.json({ ok: false, error: "Vendor not found" }, { status: 404 });
    }

    const [doc] = await db
      .insert(canaryVendorDocument)
      .values({
        vendorId: vendor_id,
        documentName: document_name,
        documentUrl: document_url,
        documentType: document_type,
      })
      .returning();

    // Record notification
    await db.insert(canaryNotification).values({
      vendorId: vendor_id,
      type: "document_uploaded",
      message: `Document "${document_name}" uploaded for vendor ${vendors[0].companyName}.`,
      status: "sent",
    });

    return Response.json({ ok: true, document: doc }, { status: 201 });
  } catch (err) {
    console.error("[canary-vendor-documents POST]", err);
    return Response.json({ ok: false, error: "Failed to create document" }, { status: 500 });
  }
}
