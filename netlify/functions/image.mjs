import { getStore } from "@netlify/blobs";

export default async (req) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response("Falta el identificador de imagen", {
        status: 400
      });
    }

    const store = getStore({
      name: "hf-sport-catalog",
      consistency: "strong"
    });

    const image = await store.get(id, { type: "blob" });

    if (!image) {
      return new Response("Imagen no encontrada", {
        status: 404
      });
    }

    return new Response(image, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error) {
    console.error(error);

    return new Response("Error al cargar la imagen", {
      status: 500
    });
  }
};
