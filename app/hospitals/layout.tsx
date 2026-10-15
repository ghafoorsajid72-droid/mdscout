import HubHeaderGate from "@/app/components/HubHeaderGate";

export default function HospitalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HubHeaderGate />
      {children}
    </>
  );
}