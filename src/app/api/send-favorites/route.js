import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { to, favorites } = await req.json();

    if (!to || !favorites || favorites.length === 0) {
      return NextResponse.json({ error: "Email and favorites are required." }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
    }

    // Build HTML email
    const rows = favorites.map((f) =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600">${f.name || ""}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${f.opportunity_type || ""}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${f.organization || ""}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${f.location || ""}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${f.date || ""}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${f.tags?.join(", ") || ""}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${f.link ? `<a href="${f.link}" style="color:#7c3aed">Link</a>` : ""}</td>
      </tr>`
    ).join("");

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:800px;margin:0 auto">
        <div style="background:#7c3aed;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">Your YouConnect Favorites</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">Here are the ${favorites.length} opportunities you saved.</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;overflow:hidden">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="background:#f8fafc">
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Name</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Type</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Organization</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Location</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Date</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Tags</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Link</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px;text-align:center">
          Sent from <a href="https://youconnect.vercel.app" style="color:#7c3aed">YouConnect</a> by YouDemonia
        </p>
      </div>
    `;

    // Send via Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "YouConnect <noreply@favorites.youdemonia.org>",
        to: [to],
        subject: `Your YouConnect Favorites (${favorites.length} opportunities)`,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return NextResponse.json({ error: data.message || "Failed to send email." }, { status: res.status });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Send favorites error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
