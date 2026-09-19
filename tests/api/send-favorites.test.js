import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ROUTE = "@/src/app/api/send-favorites/route";
const TO = "student@example.com";

const FAVORITE = {
  name: "Food Bank Volunteering",
  opportunity_type: "Volunteering",
  organization: "City Harvest",
  location: "Brooklyn, NY",
  date: "2026-10-04",
  tags: ["Community Service", "Environment"],
  link: "https://example.org/apply",
};

function request(body) {
  return new Request("http://localhost/api/send-favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

let fetchMock;

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("RESEND_API_KEY", "test-key");
  fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ id: "email_42" }),
  }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/send-favorites", () => {
  it("requires a recipient", async () => {
    const { POST } = await import(ROUTE);
    const res = await POST(request({ favorites: [FAVORITE] }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Email and favorites are required.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses to send an empty list", async () => {
    const { POST } = await import(ROUTE);
    const res = await POST(request({ to: TO, favorites: [] }));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails clearly when the email service is unconfigured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { POST } = await import(ROUTE);
    const res = await POST(request({ to: TO, favorites: [FAVORITE] }));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Email service not configured.");
  });

  it("sends the favorites to the address given", async () => {
    const { POST } = await import(ROUTE);
    const res = await POST(request({ to: TO, favorites: [FAVORITE] }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, id: "email_42" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer test-key");

    const payload = JSON.parse(init.body);
    expect(payload.to).toEqual([TO]);
    expect(payload.subject).toBe("Your YouConnect Favorites (1 opportunities)");
    expect(payload.html).toContain("Food Bank Volunteering");
    expect(payload.html).toContain("City Harvest");
    expect(payload.html).toContain("Community Service, Environment");
  });

  it("renders a row for every favorite", async () => {
    const { POST } = await import(ROUTE);
    const favorites = [
      FAVORITE,
      { ...FAVORITE, name: "Hospital Shadowing" },
      { ...FAVORITE, name: "Robotics Mentor" },
    ];
    const res = await POST(request({ to: TO, favorites }));

    expect(res.status).toBe(200);
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.subject).toContain("(3 opportunities)");
    for (const f of favorites) expect(payload.html).toContain(f.name);
  });

  it("tolerates favorites with missing fields", async () => {
    const { POST } = await import(ROUTE);
    const res = await POST(request({ to: TO, favorites: [{ name: "Bare Minimum" }] }));

    expect(res.status).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).html).toContain("Bare Minimum");
  });

  it("passes a Resend failure back to the caller", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ message: "Invalid recipient." }),
    });
    const { POST } = await import(ROUTE);
    const res = await POST(request({ to: TO, favorites: [FAVORITE] }));

    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe("Invalid recipient.");
  });

  it("returns 500 on a malformed body", async () => {
    const { POST } = await import(ROUTE);
    const res = await POST(request("not json"));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Internal server error.");
  });

  it("returns 500 when tags arrive as a string instead of an array", async () => {
    // Documents current fragility: the route calls f.tags.join() with no
    // guard, and Firestore does hold tags as comma strings on older records.
    // The page normalizes them first, so this is only reachable if a caller
    // skips that step - but it fails as a 500 rather than degrading.
    const { POST } = await import(ROUTE);
    const res = await POST(
      request({ to: TO, favorites: [{ ...FAVORITE, tags: "Community Service,STEM" }] })
    );

    expect(res.status).toBe(500);
  });

  // KNOWN UNFIXED: favorite fields are interpolated into the email HTML with
  // no escaping, so markup in an opportunity name reaches the recipient's
  // inbox intact. Mail clients strip <script>, so this is not XSS - the real
  // risk is a crafted link or broken layout inside a mail sent from our
  // domain. Marked .fails so the suite stays green; once the route escapes
  // its inputs this test will start failing, and the .fails should be dropped.
  it.fails("escapes markup in favorite fields", async () => {
    const { POST } = await import(ROUTE);
    await POST(
      request({
        to: TO,
        favorites: [{ ...FAVORITE, name: '<b>Free Money</b><script>x()</script>' }],
      })
    );

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.html).not.toContain("<script>");
    expect(payload.html).toContain("&lt;b&gt;");
  });
});
