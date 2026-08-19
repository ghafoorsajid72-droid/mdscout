import Link from "next/link";

// Mock Data (Real app mein yeh ID ke zariye database se aayega)
const MOCK_DOCTORS_DATA: Record<string, any> = {
  "1012345678": {
    name: "Dr. Sarah Ahmed",
    specialty: "Cardiology",
    npi: "1012345678",
    gender: "Female",
    address: "123 Medical Center Blvd, Chicago, IL 60601",
    phone: "(312) 555-0199",
    status: "Active Provider",
    taxonomy: "207RC0000X - Cardiovascular Disease",
  },
  "1023456789": {
    name: "Dr. Michael Chen",
    specialty: "Pediatrics",
    npi: "1023456789",
    gender: "Male",
    address: "456 Health Ave, Houston, TX 77002",
    phone: "(713) 555-0144",
    status: "Active Provider",
    taxonomy: "208000000X - Pediatrics",
  },
  "1034567890": {
    name: "Dr. Fatima Ali",
    specialty: "Dermatology",
    npi: "1034567890",
    gender: "Female",
    address: "789 Care St, New York, NY 10001",
    phone: "(212) 555-0188",
    status: "Active Provider",
    taxonomy: "207N00000X - Dermatology",
  },
  "1045678901": {
    name: "Dr. James Wilson",
    specialty: "Cardiology",
    npi: "1045678901",
    gender: "Male",
    address: "321 Heart Lane, Dallas, TX 75201",
    phone: "(214) 555-0122",
    status: "Active Provider",
    taxonomy: "207RC0000X - Cardiovascular Disease",
  },
};

export default async function DoctorProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = MOCK_DOCTORS_DATA[id];

  if (!doctor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Doctor Not Found</h2>
        <p className="text-slate-500 mt-2 mb-6">No provider record matches this NPI ID.</p>
        <Link href="/" className="text-blue-600 hover:underline font-medium">
          ← Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/" className="text-sm font-medium text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Search Results
      </Link>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-6 mb-6 gap-4">
          <div>
            <span className="inline-block px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full mb-2">
              {doctor.status}
            </span>
            <h1 className="text-3xl font-bold text-slate-900">{doctor.name}</h1>
            <p className="text-lg text-blue-600 font-medium">{doctor.specialty}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-right shrink-0">
            <span className="text-xs text-slate-500 block">NPI NUMBER</span>
            <span className="font-mono text-lg font-bold text-slate-800">{doctor.npi}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Practice Location
            </h3>
            <p className="text-slate-700 leading-relaxed">{doctor.address}</p>
            <p className="text-slate-600 text-sm mt-1">📞 {doctor.phone}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Taxonomy & Info
            </h3>
            <p className="text-slate-700 text-sm">
              <span className="font-medium">Gender:</span> {doctor.gender}
            </p>
            <p className="text-slate-700 text-sm mt-1">
              <span className="font-medium">Taxonomy Code:</span> {doctor.taxonomy}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}