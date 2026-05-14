import { db } from '@/db';
import { canaryNotification } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const notifications = await db
      .select()
      .from(canaryNotification)
      .orderBy(desc(canaryNotification.createdAt));
    return Response.json({ ok: true, notifications });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error(JSON.stringify({ level: 'error', route: 'GET /api/canary-notifications', error: msg }));
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message: msg } }, { status: 500 });
  }
}
