import { NextRequest } from 'next/server';
import { db } from '@/db';
import { canaryVendor, canaryNotification } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const vendors = await db
      .select()
      .from(canaryVendor)
      .orderBy(desc(canaryVendor.createdAt));
    return Response.json({ ok: true, vendors });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error(JSON.stringify({ level: 'error', route: 'GET /api/canary-vendors', error: msg }));
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message: msg } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendor_email, company_name, category, risk_level } = body;

    if (!vendor_email || !company_name || !category) {
      return Response.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'vendor_email, company_name, and category are required' } },
        { status: 400 }
      );
    }

    const [vendor] = await db
      .insert(canaryVendor)
      .values({
        vendorEmail: vendor_email,
        companyName: company_name,
        category,
        riskLevel: risk_level ?? 'medium',
        status: 'pending',
      })
      .returning();

    // Record notification for onboarding
    await db.insert(canaryNotification).values({
      vendorId: vendor.id,
      type: 'vendor_onboarded',
      message: `Vendor ${company_name} submitted for compliance review`,
      status: 'pending',
    });

    return Response.json({ ok: true, vendor }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error(JSON.stringify({ level: 'error', route: 'POST /api/canary-vendors', error: msg }));
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message: msg } }, { status: 500 });
  }
}
