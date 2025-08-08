import { ReactNode } from "react";

export const revalidate = 3600; // allow static regeneration for public pages

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}