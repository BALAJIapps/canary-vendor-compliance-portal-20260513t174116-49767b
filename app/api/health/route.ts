import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ ok: true, checks: { db: 'ok' } });
  } catch (e) {
    return Response.json({ ok: false, checks: { db: 'error' } }, { status: 503 });
  }
}
