"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import config from "@/config";
import runtimeConfig from "@/libs/app-config/runtime";
import { useAuthStatus } from "@/hooks/useAuthStatus";

type PlanCard = {
  id: "plus" | "pro";
  name: string;
  priceLabel: string; // e.g., $6.99 / wk
  cadence: "/wk" | "/mo";
  priceId: string;
  features: string[];
  anchor?: number;
};

function formatUSD(n: number) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  } catch {
    return `$${n}`;
  }
}

export default function PricingSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const { authed } = useAuthStatus();

  // Build plans from config but keep copy simple and universal.
  const plans: PlanCard[] = (config.stripe.plans || []).map((p) => {
    const isWeekly = /week/i.test(p.name);
    const cap = runtimeConfig.plans[p.priceId]?.monthlyGenerations ?? (isWeekly ? 20 : 100);
    const common = [
      "Unlimited AI chats",
      "Unlimited suggested prompts",
      "High‑resolution renders",
      "Smart furniture suggestions",
      "Mix & match from dozens of styles",
      "Commercial usage license",
    ];
    return {
      id: isWeekly ? "plus" : "pro",
      name: p.name,
      priceLabel: `${formatUSD(p.price)} ${isWeekly ? "/wk" : "/mo"}`,
      cadence: isWeekly ? "/wk" : "/mo",
      priceId: p.priceId,
      anchor: p.priceAnchor,
      features: [`${cap} high‑res renders included`, ...common],
    };
  });

  async function startCheckout(priceId: string) {
    try {
      setLoading(priceId);
      if (authed) {
        const resp = await fetch('/api/v1/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId }),
        });
        const json = await resp.json();
        if (!resp.ok || !json?.data?.url) throw new Error(json?.error?.message || 'checkout_failed');
        window.location.href = json.data.url;
        return;
      }
      // Guest: send to signin with priceId only; callback will create checkout
      const sp = new URLSearchParams({ priceId });
      window.location.href = `/signin?${sp.toString()}`;
    } catch (e) {
      console.error(e);
      alert('Could not start checkout. Please try again.');
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="py-24">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight">Choose Your Plan</h2>
          <p className="mt-3 text-lg lg:text-2xl text-muted-foreground">
            Tailored pricing for every need. Find the perfect plan for your design flow.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 place-items-stretch">
          {plans.map((plan) => {
            const featured = plan.id === "pro"; // Monthly featured
            return (
              <div
                key={plan.priceId}
                className={[
                  "rounded-[2rem] p-1",
                  featured ? "bg-gradient-to-br from-primary/30 via-primary/20 to-accent/40" : "bg-border/60",
                ].join(" ")}
              >
                <Card
                  className={[
                    "flex h-full w-full flex-col rounded-[1.9rem]",
                    featured ? "bg-transparent border-transparent shadow-md" : "bg-card",
                  ].join(" ")}
                >
                  <CardHeader className="text-left px-6 pt-6">
                    <CardTitle className="text-xl lg:text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-4xl lg:text-5xl font-semibold leading-none">
                        {plan.priceLabel.split(" ")[0]}
                      </span>
                      <div className="flex flex-col">
                        {typeof plan.anchor === "number" && (
                          <span className="text-sm text-muted-foreground line-through">
                            USD {plan.anchor.toFixed(2)}
                          </span>
                        )}
                        <span className="text-muted-foreground">{plan.cadence === "/wk" ? "per week" : "per month"}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6">
                    <Separator className="mb-6" />
                    <ul className="space-y-4">
                      {plan.features.map((text, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm lg:text-base">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-muted ring-1 ring-border">
                            <CircleCheck className="h-3.5 w-3.5 text-foreground" />
                          </span>
                          <span>{text}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="mt-auto px-6 pb-6">
                    <Button
                      className={[
                        "w-full rounded-full text-base lg:text-lg",
                        featured ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                      ].join(" ")}
                      onClick={() => startCheckout(plan.priceId)}
                      disabled={loading === plan.priceId}
                    >
                      {loading === plan.priceId ? "Processing…" : "Get Instant Access"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
