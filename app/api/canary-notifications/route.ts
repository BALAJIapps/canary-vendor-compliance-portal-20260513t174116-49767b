import { db } from "@/db";
import { canaryNotification } from "@/db/schema";
import { desc } from "drizzle-orm";

// NOTE: Canary endpoint — intentionally public per canary test contract.

export async function GET() {
  try {
    const notifications = await db
      .select()
      .from(canaryNotification)
      .orderBy(desc(canaryNotification.createdAt))
      .limit(100);
    return Response.json({ notifications });
  } catch (err) {
    console.error("[canary-notifications GET]", err);
    return Response.json({ ok: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}
