import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import { parse } from "csv-parse";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FILE_PATH =
  "C:\\Users\\kamra\\OneDrive\\Desktop\\NPI_Processing\\npidata_pfile_20050523-20260809.csv";

const BATCH_SIZE = 500;

let batch = [];
let totalInserted = 0;
let totalRead = 0;

async function insertBatch() {
  if (batch.length === 0) return;

  const { error } = await supabase.from("hospitals").upsert(batch, {
    onConflict: "npi_number",
  });

  if (error) {
    console.error("Insert error:", error.message);
  } else {
    totalInserted += batch.length;
  }

  batch = [];
}

async function run() {
  const parser = fs
    .createReadStream(FILE_PATH)
    .pipe(parse({ columns: true, skip_empty_lines: true }));

  for await (const row of parser) {
    totalRead++;

    if (row["Entity Type Code"] === "2") {
      const name = row["Provider Organization Name (Legal Business Name)"];
      if (name) {
        batch.push({
          npi_number: row["NPI"],
          name: name,
          address: row["ProviderFirst Line Business Practice Location Address"] || null,
          city: row["Provider Business Practice Location Address City Name"] || null,
          state: row["Provider Business Practice Location Address State Name"] || null,
          phone: row["Provider Business Practice Location Address Telephone Number"] || null,
        });
      }

      if (batch.length >= BATCH_SIZE) {
        await insertBatch();
        console.log(`Read: ${totalRead.toLocaleString()} rows | Hospitals inserted: ${totalInserted.toLocaleString()}`);
      }
    }

    if (totalRead % 500000 === 0) {
      console.log(`Progress: ${totalRead.toLocaleString()} rows read so far...`);
    }
  }

  await insertBatch(); // last remaining batch
  console.log(`DONE. Total rows read: ${totalRead.toLocaleString()}, Total hospitals inserted: ${totalInserted.toLocaleString()}`);
}

run();