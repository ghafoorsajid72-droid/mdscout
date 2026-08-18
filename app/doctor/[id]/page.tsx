import Link from 'next/link';

interface DoctorDetail {
  number: string;
  enumeration_type?: string;
  basic?: {
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    credential?: string;
    gender?: string;
    sole_proprietor?: string;
    status?: string;
    organization_name?: string;
    name?: string;
  };
  taxonomies?: Array<{
    code?: string;
    desc?: string;
    primary?: boolean;
    state?: string;
    license?: string;
  }>;
  addresses?: Array<{
    address_purpose?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    telephone_number?: string;
    fax_number?: string;
  }>;
  identifiers?: Array<{
    code?: string;
    desc?: string;
    issuer?: string;
    identifier?: string;
    state?: string;
  }>;
}

async function getDoctorDetails(npi: string): Promise<DoctorDetail | null> {
  try {
    const res = await fetch(`https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${npi}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] || null;
  } catch (err) {
    console.error('Failed to fetch doctor detail:', err);
    return null;
  }
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = await getDoctorDetails(id);

  if (!doctor) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md w-full shadow-sm">
          <div className="text-4xl mb-3">⚠️</div>
          <h1 className="text-xl font-bold text-slate-900">Provider Not Found</h1>
          <p className="text-sm text-slate-500 mt-2">Could not retrieve NPI record for ID: {id}</p>
          <Link href="/" className="inline-block mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 transition">
            ← Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const isIndividual = doctor.enumeration_type === 'NPI-1' || doctor.basic?.first_name || doctor.basic?.last_name;
  
  const fullName = isIndividual
    ? `Dr. ${doctor.basic?.first_name || ''} ${doctor.basic?.middle_name || ''} ${doctor.basic?.last_name || ''}`.replace(/\s+/g, ' ').trim()
    : doctor.basic?.organization_name || doctor.basic?.name || 'Healthcare Facility';

  const locationAddr = doctor.addresses?.find((a) => a.address_purpose === 'LOCATION') || doctor.addresses?.[0];
  const primaryTaxonomy = doctor.taxonomies?.find((t) => t.primary) || doctor.taxonomies?.[0];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">+</div>
            <span className="text-xl font-black text-slate-900">MDScout<span className="text-blue-600">.io</span></span>
          </Link>
          <Link href="/" className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1">
            ← Back to Search
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {/* Main Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md mb-3 border border-emerald-200">
                ✓ Verified NPI Profile
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {fullName} {doctor.basic?.credential && <span className="text-slate-400 font-normal text-lg">({doctor.basic.credential})</span>}
              </h1>
              <p className="text-base text-blue-600 font-semibold mt-1">
                {primaryTaxonomy?.desc || 'Healthcare Provider'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">NPI Registry ID</p>
              <p className="text-lg font-mono font-bold text-slate-900 mt-0.5">{doctor.number}</p>
            </div>
          </div>

          <hr className="my-6 border-slate-100" />

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Practice Location */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Practice Location & Contact</h2>
              {locationAddr ? (
                <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1.5 border border-slate-100">
                  <p className="font-semibold text-slate-800">{locationAddr.address_1} {locationAddr.address_2}</p>
                  <p className="text-slate-600">{locationAddr.city}, {locationAddr.state} {locationAddr.postal_code}</p>
                  {locationAddr.telephone_number && (
                    <p className="text-slate-800 pt-1 font-medium">📞 Phone: <span className="font-mono">{locationAddr.telephone_number}</span></p>
                  )}
                  {locationAddr.fax_number && (
                    <p className="text-slate-500 font-medium">📠 Fax: <span className="font-mono">{locationAddr.fax_number}</span></p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No address listed.</p>
              )}
            </div>

            {/* Specialties & Taxonomy */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Specialties & Taxonomy</h2>
              <div className="space-y-2">
                {doctor.taxonomies?.map((tax, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800">{tax.desc || 'General Specialization'}</p>
                      {tax.license && <p className="text-slate-500 text-[11px]">License: {tax.license} ({tax.state})</p>}
                    </div>
                    {tax.primary && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}