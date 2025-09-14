"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import runtimeConfig from "@/libs/app-config/runtime";
import config from "@/config";

type PlanConfig = {
  id: string;
  name: string;
  description: string;
  priceDisplay: string;
  cadenceDisplay: string;
  priceId: string;
  features: string[];
};

function formatPriceDisplay(price: number) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
  } catch {
    return `$${price}`;
  }
}

export function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Map config plans to display (assumes two plans: Weekly and Monthly)
  const plans: PlanConfig[] = (config.stripe.plans || []).map((p) => ({
    id: p.name.toLowerCase().includes("week") ? "plus" : "pro",
    name: p.name,
    description: p.name.toLowerCase().includes("week") ? "For flexible weekly access" : "For power users",
    priceDisplay: formatPriceDisplay(p.price),
    cadenceDisplay: p.name.toLowerCase().includes("week") ? "/wk" : "/mo",
    priceId: p.priceId,
    features: [
      `${runtimeConfig.plans[p.priceId]?.monthlyGenerations ?? (p.name.toLowerCase().includes('week') ? 20 : 100)} high‑res renders included`,
      "Unlimited AI chats",
      "Unlimited suggested prompts",
      "High‑resolution renders",
      "Smart furniture suggestions",
      "Mix & match from dozens of styles",
      "Commercial usage license",
    ],
  }));

  async function startCheckout(priceId: string) {
    setLoadingPlan(priceId)
    window.location.href = `/start-checkout?priceId=${encodeURIComponent(priceId)}`
  }

  return (
    <section className="py-24">
      <div className="container">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <h2 className="text-4xl font-semibold text-pretty lg:text-6xl">Pricing</h2>
          <p className="text-muted-foreground lg:text-xl">Simple plans. No surprises.</p>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 place-items-stretch">
            {plans.map((plan) => {
              const featured = plan.id === 'pro'
              return (
                <div key={plan.priceId} className={["rounded-[2rem] p-1", featured ? "bg-gradient-to-br from-primary/30 via-primary/20 to-accent/40" : "bg-border/60"].join(' ')}>
                  <Card className={["flex h-full w-full flex-col rounded-[1.9rem]", featured ? "bg-transparent border-transparent shadow-md" : "bg-card"].join(' ')}>
                    <CardHeader className="text-left px-6 pt-6">
                      <CardTitle className="text-xl lg:text-2xl">{plan.name}</CardTitle>
                      <div className="mt-3 flex items-end gap-2">
                        <span className="text-4xl lg:text-5xl font-semibold leading-none">{plan.priceDisplay}</span>
                        <span className="text-2xl lg:text-3xl font-semibold text-muted-foreground">{plan.cadenceDisplay}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-6">
                      <Separator className="mb-6" />
                      <ul className="space-y-4">
                        {plan.features.map((text, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-sm lg:text-base">
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-muted ring-1 ring-border">
                              <CircleCheck className="h-3.5 w-3.5 text-foreground" />
                            </span>
                            <span>{text}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="mt-auto px-6 pb-6">
                      <Button onClick={() => startCheckout(plan.priceId)} className={["w-full rounded-full text-base lg:text-lg", featured ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"].join(' ')} disabled={loadingPlan === plan.priceId}>
                        {loadingPlan === plan.priceId ? "Processing..." : "Get Instant Access"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Pricing;
