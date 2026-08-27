// send-inquiry: receives the dojiverse.com contact form and emails it via Resend.
// Secrets: RESEND_API_KEY (required), INQUIRY_TO / INQUIRY_FROM (optional overrides).

const ALLOWED_ORIGINS = new Set([
  "https://www.dojiverse.com",
  "https://dojiverse.com",
  "http://localhost:8321",
  "http://127.0.0.1:8321",
]);

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://www.dojiverse.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  };
}

function jsonResponse(origin: string, status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return jsonResponse(origin, 405, { error: "Method not allowed" });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(origin, 400, { error: "Invalid JSON body" });
  }

  // Honeypot: real users never fill this hidden field. Pretend success for bots.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return jsonResponse(origin, 200, { ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || name.length > 200) {
    return jsonResponse(origin, 400, { error: "Name is required" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return jsonResponse(origin, 400, { error: "A valid email is required" });
  }
  if (!message || message.length > 5000) {
    return jsonResponse(origin, 400, { error: "Message is required (max 5000 characters)" });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return jsonResponse(origin, 500, { error: "Email service not configured" });
  }
  const to = Deno.env.get("INQUIRY_TO") ?? "petcovpedro@gmail.com";
  // resend.dev sandbox sender works before dojiverse.com is verified in Resend;
  // set INQUIRY_FROM to "DOJi <inquiries@dojiverse.com>" once the domain is verified.
  const from = Deno.env.get("INQUIRY_FROM") ?? "DOJi Website <onboarding@resend.dev>";

  const html = [
    "<h2>New project inquiry — dojiverse.com</h2>",
    `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
    "<p><strong>Message:</strong></p>",
    `<p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>`,
  ].join("\n");

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `New project inquiry from ${name}`,
      html,
    }),
  });

  if (!resendRes.ok) {
    const detail = await resendRes.text();
    console.error("Resend error:", resendRes.status, detail);
    return jsonResponse(origin, 502, { error: "Failed to send email" });
  }

  return jsonResponse(origin, 200, { ok: true });
});
