import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken } from "@/lib/auth-server";
import type { SessionUser } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role as SessionUser["role"],
      avatar: user.avatar,
      address: user.address,
    };

    const token = createSessionToken(sessionUser);
    return NextResponse.json({ user: sessionUser, token });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
