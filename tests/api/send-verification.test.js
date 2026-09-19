import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ROUTE = "@/src/app/api/send-verification/route";
const EMAIL = "student@example.com";

// The route builds its code as Math.floor(100000 + Math.random() * 900000).
// Pinning Math.random to 0.5 makes that deterministic.
const CODE = "550000";

function request(method, body) {
  return new Request("http://localhost/api/send-verification", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

let fetchMock;

beforeEach(() => {
  // route.js holds codes in a module-level Map, so it has to be re-imported
  // for every test or state leaks between them.
  vi.resetModules();
  vi.stubEnv("RESEND_API_KEY", "test-key");
  fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ id: "email_1" }),
  }));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("POST /api/send-verification", () => {
  it("rejects a request with no email", async () => {
    const { POST } = await import(ROUTE);
    const res = await POST(request("POST", {}));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Email is required.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails clearly when the email service is unconfigured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { POST } = await import(ROUTE);
    const res = await POST(request("POST", { email: EMAIL }));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Email service not configured.");
  });

  it("sends the generated code to the address given", async () => {
    const { POST } = await import(ROUTE);
    const res = await POST(request("POST", { email: EMAIL }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer test-key");

    const payload = JSON.parse(init.body);
    expect(payload.to).toEqual([EMAIL]);
    expect(payload.html).toContain(CODE);
  });

  it("passes a Resend failure back to the caller", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ message: "Invalid recipient." }),
    });
    const { POST } = await import(ROUTE);
    const res = await POST(request("POST", { email: EMAIL }));

    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe("Invalid recipient.");
  });
});

describe("PUT /api/send-verification", () => {
  // Most cases need a code already issued, so this runs POST first.
  async function issueCode(email = EMAIL) {
    const route = await import(ROUTE);
    await route.POST(request("POST", { email }));
    return route;
  }

  it("requires both an email and a code", async () => {
    const { PUT } = await import(ROUTE);
    const res = await PUT(request("PUT", { email: EMAIL }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Email and code are required.");
  });

  it("rejects an email that was never issued a code", async () => {
    const { PUT } = await import(ROUTE);
    const res = await PUT(request("PUT", { email: EMAIL, code: CODE }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(
      "No verification code found. Please request a new one."
    );
  });

  it("accepts the correct code", async () => {
    const { PUT } = await issueCode();
    const res = await PUT(request("PUT", { email: EMAIL, code: CODE }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ verified: true });
  });

  it("will not accept the same code twice", async () => {
    const { PUT } = await issueCode();

    const first = await PUT(request("PUT", { email: EMAIL, code: CODE }));
    expect(first.status).toBe(200);

    // A verified code is deleted, so replaying it must fail.
    const replay = await PUT(request("PUT", { email: EMAIL, code: CODE }));
    expect(replay.status).toBe(400);
    expect((await replay.json()).error).toBe(
      "No verification code found. Please request a new one."
    );
  });

  it("rejects a wrong code", async () => {
    const { PUT } = await issueCode();
    const res = await PUT(request("PUT", { email: EMAIL, code: "000000" }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Incorrect code. Please try again.");
  });

  it("rejects a code once its ten minutes are up", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-19T12:00:00Z"));

    const { PUT } = await issueCode();

    vi.setSystemTime(new Date("2026-09-19T12:10:01Z"));
    const res = await PUT(request("PUT", { email: EMAIL, code: CODE }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Code expired. Please request a new one.");
  });

  it("allows five wrong guesses, then locks out on the sixth", async () => {
    const { PUT } = await issueCode();
    const guess = () => PUT(request("PUT", { email: EMAIL, code: "000000" }));

    for (let i = 1; i <= 5; i++) {
      expect((await guess()).status, `guess ${i} should still be allowed`).toBe(400);
    }

    const locked = await guess();
    expect(locked.status).toBe(429);
    expect((await locked.json()).error).toBe(
      "Too many attempts. Please request a new code."
    );
  });

  it("locks out on the sixth try even when the code is right", async () => {
    const { PUT } = await issueCode();

    for (let i = 1; i <= 5; i++) {
      await PUT(request("PUT", { email: EMAIL, code: "000000" }));
    }

    // The attempt counter is checked before the code is compared, so a
    // correct code arriving sixth is still refused.
    const res = await PUT(request("PUT", { email: EMAIL, code: CODE }));
    expect(res.status).toBe(429);
  });

  it("matches the email regardless of case", async () => {
    const { PUT } = await issueCode("Student@Example.COM");
    const res = await PUT(request("PUT", { email: "student@example.com", code: CODE }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ verified: true });
  });
});
