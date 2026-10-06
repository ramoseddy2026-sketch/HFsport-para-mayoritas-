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
        JSON.stringify({ ok
