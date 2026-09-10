import { NextResponse } from "next/server";
import {
  ADMIN_EMAIL,
  checkIpBanStatus,
  getClientIp,
  logAdminAudit,
  verifyAdminMagicToken,
} from "@/lib/adminSecurity";
import {
  getAllUsers,
  getUserById,
  updateUser,
  modifyUserPlanDuration,
  AdminUserRecord,
} from "@/lib/adminStore";

export const dynamic = "force-dynamic";

// Middleware verification helper
function verifyAdminRequest(req: Request): { authorized: boolean; error?: string; status?: number } {
  const ip = getClientIp(req);
  const banStatus = checkIpBanStatus(ip);
  if (banStatus.isBanned) {
    return {
      authorized: false,
      error: `IP banned for 30 minutes. Remaining: ${banStatus.remainingSeconds}s`,
      status: 403,
    };
  }

  const token = req.headers.get("x-admin-token") || "";
  const email = req.headers.get("x-admin-email") || ADMIN_EMAIL;

  const valid = verifyAdminMagicToken(token, email);
  if (!valid.valid) {
    return {
      authorized: false,
      error: "Unauthorized or expired 10-minute magic token. Re-authenticate via privacy page.",
      status: 401,
    };
  }

  return { authorized: true };
}

// GET /api/admin/users - Fetch all users
export async function GET(request: Request) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const users = await getAllUsers();
    return NextResponse.json({ ok: true, users, count: users.length });
  } catch (err) {
    console.error("Failed to fetch users:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/admin/users - Update user, modify plan duration, adjust nodes, toggle ban
export async function POST(request: Request) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status || 401 });
  }

  const ip = getClientIp(request);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "update_user";
  const targetUid = typeof body.uid === "string" ? body.uid : "";

  if (!targetUid) {
    return NextResponse.json({ ok: false, error: "Missing target user UID" }, { status: 400 });
  }

  try {
    if (action === "modify_duration") {
      // Modify plan duration: +days, -days, or set exact custom date
      const daysDelta = typeof body.daysDelta === "number" ? body.daysDelta : null;
      const customExpiryDate = typeof body.customExpiryDate === "string" ? body.customExpiryDate : undefined;

      const updated = await modifyUserPlanDuration(targetUid, daysDelta, customExpiryDate);

      logAdminAudit({
        adminEmail: ADMIN_EMAIL,
        action: "MODIFY_USER_DURATION",
        targetUserId: targetUid,
        details: `Adjusted plan duration for ${updated.email}: ${
          daysDelta !== null ? `${daysDelta > 0 ? "+" : ""}${daysDelta} days` : `set to ${customExpiryDate}`
        }. New expiry: ${updated.expiresAt}`,
        ip,
      });

      return NextResponse.json({ ok: true, user: updated, message: "User plan duration updated successfully." });
    }

    if (action === "change_plan") {
      // Change plan tier and nodes
      const plan = body.plan as AdminUserRecord["plan"];
      const status = (body.status as AdminUserRecord["status"]) || "active";
      const nodes = typeof body.nodes === "number" ? body.nodes : undefined;

      const updates: Partial<AdminUserRecord> = { plan, status };
      if (nodes !== undefined) {
        updates.nodes = nodes;
        updates.nodeLimit = nodes;
      }

      // If upgrading from free or expired, extend by default 30 days if no expiry
      const currentUser = await getUserById(targetUid);
      if (plan !== "free" && (!currentUser?.expiresAt || new Date(currentUser.expiresAt).getTime() < Date.now())) {
        updates.expiresAt = new Date(Date.now() + 30 * 864e5).toISOString();
      }

      const updated = await updateUser(targetUid, updates);

      logAdminAudit({
        adminEmail: ADMIN_EMAIL,
        action: "CHANGE_USER_PLAN",
        targetUserId: targetUid,
        details: `Changed plan for ${updated.email} to '${plan}' (${status}) with ${updated.nodes} nodes.`,
        ip,
      });

      return NextResponse.json({ ok: true, user: updated, message: `Plan updated to ${plan}.` });
    }

    if (action === "toggle_ban") {
      // Ban or unban user account
      const isBanned = Boolean(body.isBanned);
      const updated = await updateUser(targetUid, {
        isBanned,
        status: isBanned ? "banned" : "active",
      });

      logAdminAudit({
        adminEmail: ADMIN_EMAIL,
        action: isBanned ? "BAN_USER" : "UNBAN_USER",
        targetUserId: targetUid,
        details: `${isBanned ? "Banned" : "Unbanned"} user ${updated.email}. Reason: ${body.reason || "Admin decision"}`,
        ip,
      });

      return NextResponse.json({
        ok: true,
        user: updated,
        message: isBanned ? "User has been banned." : "User has been unbanned.",
      });
    }

    if (action === "update_user") {
      // General full modification
      const fieldsToUpdate = (body.updates as Partial<AdminUserRecord>) || {};
      const updated = await updateUser(targetUid, fieldsToUpdate);

      logAdminAudit({
        adminEmail: ADMIN_EMAIL,
        action: "UPDATE_USER_PROFILE",
        targetUserId: targetUid,
        details: `Updated profile & metadata for ${updated.email} (${Object.keys(fieldsToUpdate).join(", ")})`,
        ip,
      });

      return NextResponse.json({ ok: true, user: updated, message: "User updated successfully." });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Admin user modification failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Action failed" },
      { status: 500 }
    );
  }
}
