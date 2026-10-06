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
    const form = await req.formData();

    const name = String(form.get("name") || "").trim();

    if (!name) {
      return new Response(
        JSON.stringify({ ok: false, error: "Falta el nombre del producto" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const store = getStore({
      name: "hf-sport-catalog",
      consistency: "strong"
    });

    const products = (await store.get("products", { type: "json" })) || [];

    const id = crypto.randomUUID();
    const image = form.get("image");

    let imageUrl = "";

    if (image && typeof image === "object" && image.size > 0) {
      const extension =
        String(image.name || "image.jpg").split(".").pop() || "jpg";

      const imageKey = `images/${id}.${extension}`;

      await store.set(imageKey, image);
      imageUrl = `/api/image?id=${encodeURIComponent(imageKey)}`;
    }

    const product = {
      id,
      name,
      season: String(form.get("season") || ""),
      audience: String(form.get("audience") || ""),
      category: String(form.get("category") || ""),
      subcategory: String(form.get("subcategory") || ""),
      fabric: String(form.get("fabric") || ""),
      price: String(form.get("price") || ""),
      sizes: String(form.get("sizes") || ""),
      colors: String(form.get("colors") || ""),
      description: String(form.get("description") || ""),
      image: imageUrl,
      active: true,
      createdAt: new Date().toISOString()
    };

    products.push(product);

    await store.set("products", JSON.stringify(products), {
      metadata: { contentType: "application/json" }
    });

    return new Response(
      JSON.stringify({ ok: true, product }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        ok: false,
        error: "No se pudo guardar el producto"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
