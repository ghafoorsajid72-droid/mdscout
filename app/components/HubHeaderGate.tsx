"use client";

import { usePathname } from "next/navigation";
import HubHeader from "@/app/components/HubHeader";

export default function HubHeaderGate() {
  const pathname = usePathname();
  if (pathname === "/hospitals") return null;
  return <HubHeader />;
}