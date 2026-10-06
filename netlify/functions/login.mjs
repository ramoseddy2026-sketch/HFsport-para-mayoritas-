export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { password } = await req.json();
    const adminPassword = Netlify.env.get("HF_ADMIN_PASSWORD");

    if (!adminPassword || password !== adminPassword) {
      return new Response(
        JSON.stringify({ ok: false, error: "Contraseña incorrecta" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": "hf_admin=1; HttpOnly; Path=/; SameSite=Lax"
        }
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Solicitud inválida" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
