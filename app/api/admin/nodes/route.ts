import { NextResponse } from "next/server";
import {
  ADMIN_EMAIL,
  checkIpBanStatus,
  getClientIp,
  logAdminAudit,
  verifyAdminMagicToken,
} from "@/lib/adminSecurity";
import {
  createFleetNode,
  deleteFleetNode,
  getAllFleetNodes,
  updateFleetNode,
  AdminFleetNode,
} from "@/lib/adminStore";

export const dynamic = "force-dynamic";

function verifyAdminRequest(req: Request) {
  const ip = getClientIp(req);
  const banStatus = checkIpBanStatus(ip);
  if (banStatus.isBanned) {
    return { authorized: false, error: "IP is banned", status: 403 };
  }
  const token = req.headers.get("x-admin-token") || "";
  const email = req.headers.get("x-admin-email") || ADMIN_EMAIL;
  const valid = verifyAdminMagicToken(token, email);
  if (!valid.valid) {
    return { authorized: false, error: "Invalid/expired magic token", status: 401 };
  }
  return { authorized: true };
}

// GET /api/admin/nodes - List all fleet nodes
export async function GET(request: Request) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const nodes = await getAllFleetNodes();
  return NextResponse.json({ ok: true, nodes });
}

// POST /api/admin/nodes - Create / Provision a new node
export async function POST(request: Request) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const ip = getClientIp(request);
  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "user_ssynthrun";
  const name = typeof body.name === "string" ? body.name : "Custom Node";
  const region = typeof body.region === "string" ? body.region : "us-east-1 (N. Virginia)";
  const host = typeof body.host === "string" ? body.host : "127.0.0.1";
  const port = typeof body.port === "number" ? body.port : 8443;
  const nodeId = typeof body.nodeId === "string" ? body.nodeId : `cf-node-${Math.random().toString(36).slice(2, 8)}`;
  const policyMode = (body.policyMode as AdminFleetNode["policyMode"]) || "strict";

  const newNode = await createFleetNode({
    nodeId,
    userId,
    name,
    region,
    host,
    port,
    status: "online",
    version: "v2.4.1",
    latencyMs: Math.floor(Math.random() * 20) + 5,
    cpuUsage: Math.floor(Math.random() * 30) + 10,
    memoryUsage: Math.floor(Math.random() * 40) + 20,
    token: `cf_sec_tok_${Math.random().toString(36).slice(2, 12)}`,
    policyMode,
  });

  logAdminAudit({
    adminEmail: ADMIN_EMAIL,
    action: "CREATE_FLEET_NODE",
    targetUserId: userId,
    details: `Provisioned node '${name}' (${nodeId}) in region ${region} for user ${userId}`,
    ip,
  });

  return NextResponse.json({ ok: true, node: newNode });
}

// PUT /api/admin/nodes - Edit existing node
export async function PUT(request: Request) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const ip = getClientIp(request);
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing node ID" }, { status: 400 });
  }

  const updates = (body.updates as Partial<AdminFleetNode>) || {};
  const updated = await updateFleetNode(id, updates);

  logAdminAudit({
    adminEmail: ADMIN_EMAIL,
    action: "UPDATE_FLEET_NODE",
    targetUserId: updated.userId,
    details: `Updated fleet node '${updated.name}' (${updated.nodeId}): ${Object.keys(updates).join(", ")}`,
    ip,
  });

  return NextResponse.json({ ok: true, node: updated });
}

// DELETE /api/admin/nodes - Delete node
export async function DELETE(request: Request) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const ip = getClientIp(request);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing node ID" }, { status: 400 });
  }

  await deleteFleetNode(id);

  logAdminAudit({
    adminEmail: ADMIN_EMAIL,
    action: "DELETE_FLEET_NODE",
    details: `Deleted fleet node ID ${id}`,
    ip,
  });

  return NextResponse.json({ ok: true, message: "Node deleted successfully" });
}
