import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH_SIZE = 50;
const DELAY_MS = 1100;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeAddress(city, state) {
  const query = encodeURIComponent(`${city}, ${state}, USA`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": "MDScoutGeocoder/1.0 (contact@getmdscout.com)" },
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (data.length === 0) return null;

  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

async function run() {
  let totalUpdated = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: doctors, error } = await supabase
      .from("doctors")
      .select("id, city, state")
      .is("latitude", null)
      .not("city", "is", null)
      .not("state", "is", null)
      .limit(BATCH_SIZE);

    if (error) {
      console.error("Fetch error:", error);
      break;
    }

    if (!doctors || doctors.length === 0) {
      hasMore = false;
      break;
    }

    const cache = new Map();

    for (const doc of doctors) {
      const key = `${doc.city}|${doc.state}`;
      let coords = cache.get(key);

      if (!coords) {
        coords = await geocodeAddress(doc.city, doc.state);
        cache.set(key, coords);
        await sleep(DELAY_MS);
      }

      if (coords) {
        await supabase
          .from("doctors")
          .update({ latitude: coords.lat, longitude: coords.lon })
          .eq("id", doc.id);
        totalUpdated++;
      } else {
        await supabase
          .from("doctors")
          .update({ latitude: 0, longitude: 0 })
          .eq("id", doc.id);
      }
    }

    console.log(`Processed batch, total updated so far: ${totalUpdated}`);
  }

  console.log(`Done. Total updated: ${totalUpdated}`);
}

run();