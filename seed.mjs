import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dolmodcgwmuejkmqntit.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qiaQY5jNgecySdh8DpvCXQ_TMNam9Pa";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const specialties = ["Cardiology", "Dermatology", "Pediatrics", "Neurology", "Orthopedics", "Gastroenterology", "Oncology", "Psychiatry", "Urology", "Ophthalmology"];
const cities = [
  { city: "New York", state: "NY" }, { city: "Los Angeles", state: "CA" },
  { city: "Chicago", state: "IL" }, { city: "Houston", state: "TX" },
  { city: "Phoenix", state: "AZ" }, { city: "Philadelphia", state: "PA" },
  { city: "San Antonio", state: "TX" }, { city: "San Diego", state: "CA" }
];
const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"];

const bulkDoctors = Array.from({ length: 100 }, (_, i) => {
  const location = cities[i % cities.length];
  return {
    npi_number: String(1000000000 + i + 150),
    first_name: firstNames[i % firstNames.length],
    last_name: lastNames[i % lastNames.length],
    specialty: specialties[i % specialties.length],
    city: location.city,
    state: location.state,
  };
});

async function seedBulkDoctors() {
  console.log("🚀 Seeding 100 Doctors to Supabase...");
  const { data, error } = await supabase.from("doctors").insert(bulkDoctors);

  if (error) {
    console.error("❌ Database Insert Error:", error.message);
  } else {
    console.log(`✅ Success! ${bulkDoctors.length} Doctors added successfully!`);
  }
}

seedBulkDoctors();