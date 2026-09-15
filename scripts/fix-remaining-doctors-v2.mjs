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
  console.log("Step 1: Finding remaining unique city+state combinations...\n");

  const uniqueLocations = new Map();
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
      const key = `${row.city.trim()}|${row.state.trim()}`;
      if (!uniqueLocations.has(key)) {
        uniqueLocations.set(key, { city: row.city.trim(), state: row.state.trim() });
      }
    }

    offset += PAGE_SIZE;
    console.log(`Scanned ${offset.toLocaleString()} rows, ${uniqueLocations.size.toLocaleString()} unique locations...`);
  }

  console.log(`\nFound ${uniqueLocations.size.toLocaleString()} remaining unique locations.\n`);
  console.log("Step 2: Geocoding + saving each to city_coordinates table...\n");

  let processed = 0;
  let saved = 0;

  for (const [key, loc] of uniqueLocations.entries()) {
    const coords = await geocodeAddress(loc.city, loc.state);
    processed++;

    if (coords) {
      const { error } = await supabase
        .from("city_coordinates")
        .upsert(
          { city: loc.city, state: loc.state, latitude: coords.lat, longitude: coords.lon },
          { onConflict: "city,state" }
        );
      if (!error) saved++;
    }

    if (processed % 20 === 0) {
      console.log(`Geocoded ${processed} / ${uniqueLocations.size}, saved ${saved} coordinates...`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nStep 2 complete. ${saved.toLocaleString()} coordinates saved to city_coordinates table.\n`);
  console.log("Step 3: Running single bulk SQL update (via RPC)...\n");

  const { error: rpcError } = await supabase.rpc("apply_city_coordinates_to_doctors");

  if (rpcError) {
    console.error("Bulk update RPC error:", rpcError.message);
    console.log("\nYou can run the SQL manually instead (see next message).");
  } else {
    console.log("DONE! Bulk update applied successfully via database-side join.");
  }
}

run();