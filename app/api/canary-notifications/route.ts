import { db } from "@/db";
import { canaryNotification } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const notifications = await db
      .select()
      .from(canaryNotification)
      .orderBy(desc(canaryNotification.createdAt));
    return Response.json({ notifications });
  } catch (err) {
    console.error("[canary-notifications GET]", err);
    return Response.json({ ok: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}
