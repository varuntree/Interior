import { ReactNode } from "react";
import { redirect } from "next/navigation";

export default async function LayoutPrivate({ children }: { children: ReactNode }) {
  // Relative path works in RSC; cookies are forwarded automatically.
  const res = await fetch("/api/v1/auth/me", { cache: "no-store" });
  if (res.status === 401) redirect("/signin");
  // We don't need user data here, only the auth check, so we don't parse.
  return <>{children}</>;
}