import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DELAY_MS = 1100;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeAddress(city, state) {
  const query = encodeURIComponent(`${city}, ${state}, USA`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MDScoutGeocoder/1.0 (contact@getmdscout.com)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (err) {
    console.log(`Error geocoding ${city}, ${state}:`, err.message);
    return null;
  }
}

async function run() {
  console.log("Step 1: Fetching all unique city+state combinations from doctors table...");

  // Get all distinct city/state pairs among doctors still missing coordinates
  const uniqueLocations = new Map(); // key: "city|state" -> {city, state}
  let offset = 0;
  const PAGE_SIZE = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("doctors")
      .select("city, state")
      .is("latitude", null)
      .not("city", "is", null)
      .not("state", "is", null)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("Fetch error:", error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    for (const row of data) {
      const city = row.city.trim();
      const state = row.state.trim();
      const key = `${city}|${state}`;
      if (!uniqueLocations.has(key)) {
        uniqueLocations.set(key, { city, state });
      }
    }

    offset += PAGE_SIZE;
    console.log(`Scanned ${offset.toLocaleString()} doctor rows so far, ${uniqueLocations.size.toLocaleString()} unique locations found...`);
  }

  console.log(`\nStep 1 complete. Total unique city+state combinations: ${uniqueLocations.size.toLocaleString()}\n`);
  console.log("Step 2: Geocoding each unique location once...\n");

  const locationCoords = new Map(); // key: "city|state" -> {lat, lon} or null
  let processed = 0;

  for (const [key, loc] of uniqueLocations.entries()) {
    const coords = await geocodeAddress(loc.city, loc.state);
    locationCoords.set(key, coords);
    processed++;

    if (processed % 50 === 0) {
      console.log(`Geocoded ${processed.toLocaleString()} / ${uniqueLocations.size.toLocaleString()} unique locations...`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nStep 2 complete. All unique locations geocoded.\n`);
  console.log("Step 3: Bulk-updating doctors table...\n");

  let totalUpdated = 0;

  for (const [key, coords] of locationCoords.entries()) {
    const [city, state] = key.split("|");

    if (coords) {
      const { error, count } = await supabase
        .from("doctors")
        .update({ latitude: coords.lat, longitude: coords.lon })
        .eq("city", city)
        .eq("state", state)
        .is("latitude", null);

      if (error) {
        console.log(`Update error for ${city}, ${state}:`, error.message);
      } else {
        totalUpdated++;
      }
    } else {
      // Mark as failed so we don't retry forever
      await supabase
        .from("doctors")
        .update({ latitude: 0, longitude: 0 })
        .eq("city", city)
        .eq("state", state)
        .is("latitude", null);
    }

    if (totalUpdated % 100 === 0 && totalUpdated > 0) {
      console.log(`Updated ${totalUpdated.toLocaleString()} location groups so far...`);
    }
  }

  console.log(`\nDONE! All unique locations processed and doctors updated.`);
}

run();