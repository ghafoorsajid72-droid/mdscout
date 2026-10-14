import HubHeader from "@/app/components/HubHeader";

export default function DoctorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HubHeader />
      {children}
    </>
  );
}