// Server-side auth helpers - session stored as signed base64 token
import { db } from "@/lib/db";
import type { SessionUser, Role } from "@/lib/types";

const SECRET = "theidrott-secret-key-2026";

// Simple base64url encode/decode with HMAC-like signature
function sign(payload: string): string {
  // Simple hash signature (NOT cryptographically secure — demo only)
  let hash = 0;
  const combined = payload + SECRET;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Buffer.from(payload).toString("base64") + "." + Math.abs(hash).toString(36);
}

function verify(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  let hash = 0;
  const decoded = Buffer.from(payload, "base64").toString();
  const combined = decoded + SECRET;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  if (Math.abs(hash).toString(36) !== sig) return null;
  return decoded;
}

export function createSessionToken(user: SessionUser): string {
  return sign(JSON.stringify(user));
}

export function verifySessionToken(token: string): SessionUser | null {
  const decoded = verify(token);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded) as SessionUser;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: Request): Promise<SessionUser | null> {
  // Check Authorization header first
  const auth = req.headers.get("authorization");
  if (auth) {
    const token = auth.replace("Bearer ", "");
    const user = verifySessionToken(token);
    if (user) return user;
  }
  // Fall back to ?token= query parameter (used by window.open exports)
  const url = new URL(req.url);
  const queryToken = url.searchParams.get("token");
  if (queryToken) {
    return verifySessionToken(queryToken);
  }
  return null;
}

export async function requireRole(req: Request, role: Role): Promise<SessionUser | null> {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== role) return null;
  return user;
}

// Notification helper - creates DB row + returns the created notification
export async function pushNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
}) {
  return db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedId: params.relatedId || null,
    },
  });
}

// Notify all admins
export async function notifyAdmins(params: {
  type: string;
  title: string;
  message: string;
  relatedId?: string;
}) {
  const admins = await db.user.findMany({ where: { role: "ADMIN" } });
  for (const admin of admins) {
    await pushNotification({ ...params, userId: admin.id });
  }
}
