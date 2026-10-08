import { getStore } from "@netlify/blobs";

function isAdmin(req) {
  const cookie = req.headers.get("cookie") || "";
  return cookie.includes("hf_admin=1");
}

export default async (req) => {
  if (!isAdmin(req)) {
    return new Response(
      JSON.stringify({ ok: false, error: "No autorizado" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { id } = await req.json();

    const store = getStore({
      name: "hf-sport-catalog",
      consistency: "strong"
    });

    const products = (await store.get("products", { type: "json" })) || [];
    const product = products.find((item) => item.id === id);

    if (!product) {
      return new Response(
        JSON.stringify({ ok: false, error: "Producto no encontrado" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const updatedProducts = products.filter((item) => item.id !== id);

    await store.set("products", JSON.stringify(updatedProducts), {
      metadata: { contentType: "application/json" }
    });

    return new Response(
      JSON.stringify({ ok: true }),
      {
status: 200,
headers: { "Content-Type": "application/json" }
      }
      );
    } catch (error) {
return new Response(
JSON.stringify({
ok: false,
error: error?.message || "Error interno"
}),
{
status: 500,
headers: { "Content-Type": "application/json" }
}
);
}
};
