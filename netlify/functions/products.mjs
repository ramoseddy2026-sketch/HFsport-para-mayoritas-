import { getStore } from "@netlify/blobs";

export default async () => {
  try {
    const store = getStore({
      name: "hf-sport-catalog",
      consistency: "strong"
    });

    const products = await store.get("products", { type: "json" });

    return new Response(
      JSON.stringify(products || []),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify([]),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};
