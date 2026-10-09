
import { getStore } from "@netlify/blobs";

function isAdmin(req) {
  const cookie = req.headers.get("cookie") || "";
  return cookie.split(";").some(
    (part) => part.trim() === "hf_admin=1"
  );
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export default async (req) => {
  if (req.method !== "POST") {
    return jsonResponse(
      { ok: false, error: "Método no permitido" },
      405
    );
  }

  if (!isAdmin(req)) {
    return jsonResponse(
      { ok: false, error: "No autorizado. Volvé a ingresar al administrador." },
      401
    );
  }

  try {
    const form = await req.formData();
    const rawData = form.get("data");

    let data;

    if (typeof rawData === "string" && rawData) {
      data = JSON.parse(rawData);
    } else {
      data = {
        name: form.get("name"),
        season: form.get("season"),
        audience: form.get("audience"),
        category: form.get("category"),
        subcategory: form.get("subcategory"),
        fabric: form.get("fabric"),
        price: form.get("price"),
        sizes: form.get("sizes"),
        colors: form.get("colors"),
        description: form.get("description"),
        id: form.get("id")
      };
    }

    const name = String(data.name || "").trim();

    if (!name) {
      return jsonResponse(
        { ok: false, error: "Falta el nombre del producto." },
        400
      );
    }

    const store = getStore({
      name: "hf-sport-catalog",
      consistency: "strong"
    });

    // Usar siempre la misma clave para conservar el catálogo.
    const products =
      (await store.get("products", { type: "json" })) || [];

    const id = String(data.id || crypto.randomUUID());
    const existingIndex = products.findIndex(
      (product) => String(product.id) === id
    );
    const existing =
      existingIndex >= 0 ? products[existingIndex] : null;

    const image = form.get("image");
    let imageUrl = existing?.image || data.image || "";

    if (
      image &&
      typeof image === "object" &&
      typeof image.size === "number" &&
      image.size > 0
    ) {
      if (!image.type || !image.type.startsWith("image/")) {
        return jsonResponse(
          { ok: false, error: "El archivo seleccionado no es una imagen válida." },
          400
        );
      }

      const extensions = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif"
      };

      const extension = extensions[image.type];

      if (!extension) {
        return jsonResponse(
          { ok: false, error: "Formato no admitido. Usá JPG, PNG, WEBP o GIF." },
          400
        );
      }

      const imageKey = `images/${id}.${extension}`;

      await store.set(imageKey, image);
      imageUrl = `/api/image?id=${encodeURIComponent(imageKey)}`;
    }

    const product = {
      ...(existing || {}),
      ...data,
      id,
      name,
      season: String(data.season || ""),
      audience: String(data.audience || ""),
      category: String(data.category || ""),
      subcategory: String(data.subcategory || ""),
      fabric: String(data.fabric || ""),
      price: String(data.price || ""),
      sizes: Array.isArray(data.sizes)
        ? data.sizes
        : String(data.sizes || "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
      colors: Array.isArray(data.colors)
        ? data.colors
        : String(data.colors || "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
      description: String(data.description || ""),
      image: imageUrl,
      active: data.active ?? existing?.active ?? true,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      products[existingIndex] = product;
    } else {
      products.push({
        ...product,
        createdAt: new Date().toISOString()
      });
    }

    await store.set("products", JSON.stringify(products), {
      metadata: { contentType: "application/json" }
    });

    return jsonResponse({ ok: true, product });
  } catch (error) {
    console.error("Error al guardar producto:", error);

    return jsonResponse(
      {
        ok: false,
        error: `No se pudo guardar: ${error.message || "error interno"}`
      },
      500
    );
  }
};
