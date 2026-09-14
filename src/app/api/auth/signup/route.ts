import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Faculty accounts are admin-created via invite only — never self-registered.
const ALLOWED_ROLES = ["student"] as const;

export async function POST(request: Request) {
  let body: {
    email?: string;
    password?: string;
    fullName?: string;
    role?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { email, password, fullName, role } = body;

  if (!email || !password || !fullName || !role) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields." },
      { status: 400 }
    );
  }
  // Admin accounts are provisioned via the seed script, never through signup.
  if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return NextResponse.json(
      { ok: false, error: "Invalid role for signup." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (error) {
      const status = /already|exists|registered/i.test(error.message) ? 409 : 500;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
    });

    if (profileError) {
      // Roll back the auth user so the account can be retried cleanly.
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json(
        { ok: false, error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data: { id: data.user.id } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect to authentication service.";
    if (message.includes("fetch failed") || message.includes("ENOTFOUND")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Cannot connect to Supabase. Please configure your live NEXT_PUBLIC_SUPABASE_URL and keys in .env",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
