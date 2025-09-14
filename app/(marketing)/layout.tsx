import { ReactNode } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";

export const revalidate = 3600; // allow static regeneration for public pages

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketingNavbar />
      {children}
    </>
  );
}
