import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dolmodcgwmuejkmqntit.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_qiaQY5jNgecySdh8DpvCXQ_TMNam9Pa";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchAndSeedDoctors() {
  console.log("🚀 Real Doctors Data Fetching Started...");

  try {
    const response = await fetch(
      "https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=100&enumeration_type=NPI-1"
    );
    const data = await response.json();

    if (!data.results) {
      console.error("❌ Data fetch nahi ho saka.");
      return;
    }

    const doctors = data.results.map((item) => {
      const basic = item.basic || {};
      const address = item.addresses?.[0] || {};
      const taxonomy = item.taxonomies?.[0] || {};

      return {
        npi_number: String(item.number),
        first_name: basic.first_name || "N/A",
        last_name: basic.last_name || "N/A",
        specialty: taxonomy.desc || "General Practice",
        city: address.city || "N/A",
        state: address.state || "N/A",
      };
    });

    const { error } = await supabase.from("doctors").insert(doctors);

    if (error) {
      console.error("❌ Database Insert Error:", error.message);
    } else {
      console.log(`✅ Mubarak ho! ${doctors.length} real doctors Supabase mein add ho gaye hain!`);
    }
  } catch (err) {
    console.error("❌ Unexpected Error:", err);
  }
}

fetchAndSeedDoctors();