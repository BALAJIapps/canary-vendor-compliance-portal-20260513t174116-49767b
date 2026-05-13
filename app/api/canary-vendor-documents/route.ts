import { NextRequest } from "next/server";
import { db } from "@/db";
import { canaryVendorDocument, canaryVendor, canaryNotification } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// NOTE: These canary endpoints are intentionally public per canary test contract.

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_STRING_LENGTH = 255;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const documents = await db
      .select()
      .from(canaryVendorDocument)
      .orderBy(desc(canaryVendorDocument.createdAt))
      .limit(100);
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

    if (!isValidUUID(String(vendor_id))) {
      return Response.json({ ok: false, error: "vendor_id must be a valid UUID" }, { status: 400 });
    }

    if (!isValidURL(String(document_url))) {
      return Response.json({ ok: false, error: "document_url must be a valid URL" }, { status: 400 });
    }

    if (String(document_name).length > MAX_STRING_LENGTH) {
      return Response.json({ ok: false, error: "document_name too long (max 255)" }, { status: 400 });
    }

    if (String(document_type).length > MAX_STRING_LENGTH) {
      return Response.json({ ok: false, error: "document_type too long (max 255)" }, { status: 400 });
    }

    // Verify vendor exists
    const vendors = await db
      .select()
      .from(canaryVendor)
      .where(eq(canaryVendor.id, String(vendor_id)))
      .limit(1);

    if (!vendors.length) {
      return Response.json({ ok: false, error: "Vendor not found" }, { status: 404 });
    }

    const [doc] = await db
      .insert(canaryVendorDocument)
      .values({
        vendorId: String(vendor_id),
        documentName: String(document_name),
        documentUrl: String(document_url),
        documentType: String(document_type),
      })
      .returning();

    // Record notification
    await db.insert(canaryNotification).values({
      vendorId: String(vendor_id),
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
