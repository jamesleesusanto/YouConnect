import { NextResponse } from "next/server";

// In-memory store for codes (resets on server restart — fine for dev/small scale)
// For production, use a database or Redis
const codes = new Map();

export async function POST(req) {
  try {
    const { email, action } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
    }

    // Action: "send" = generate and send code, "verify" = check code
    if (action === "verify") {
      const { code } = await req.json().catch(() => ({}));
      // Re-parse since we already consumed the body — get code from the original parse
      return NextResponse.json({ error: "Use the verify endpoint correctly." }, { status: 400 });
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code
    codes.set(email.toLowerCase(), { code, expires, attempts: 0 });

    // Send email via Resend
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px">
        <div style="text-align:center;margin-bottom:32px">
          <h1 style="font-size:24px;font-weight:800;color:#1a1a2e;margin:0">
            you<span style="color:#7c3aed;font-style:italic">demonia</span>
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:40px 32px;text-align:center">
          <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 8px">Verify your email</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 32px">Enter this code to create your YouConnect account:</p>
          <div style="background:#f8f6ff;border:2px solid #7c3aed;border-radius:12px;padding:20px;margin:0 auto;max-width:240px">
            <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#7c3aed;font-family:monospace">${code}</span>
          </div>
          <p style="font-size:12px;color:#94a3b8;margin:24px 0 0">This code expires in 10 minutes.</p>
        </div>
        <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:24px">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "YouConnect <noreply@favorites.youdemonia.org>",
        to: [email],
        subject: "Your YouConnect Verification Code",
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return NextResponse.json({ error: data.message || "Failed to send email." }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Send verification error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// Verify code endpoint
export async function PUT(req) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
    }

    const stored = codes.get(email.toLowerCase());

    if (!stored) {
      return NextResponse.json({ error: "No verification code found. Please request a new one." }, { status: 400 });
    }

    if (Date.now() > stored.expires) {
      codes.delete(email.toLowerCase());
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
    }

    stored.attempts++;
    if (stored.attempts > 5) {
      codes.delete(email.toLowerCase());
      return NextResponse.json({ error: "Too many attempts. Please request a new code." }, { status: 429 });
    }

    if (stored.code !== code) {
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    // Code is correct — clean up
    codes.delete(email.toLowerCase());
    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error("Verify code error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
