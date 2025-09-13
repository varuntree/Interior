import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { Hero } from "@/components/marketing/Hero";
import { StylesStrip } from "@/components/marketing/StylesStrip";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { CTASection } from "@/components/marketing/CTASection";

export default function Page() {
  return (
    <>
      <MarketingHeader />
      <main>
        <Hero />
        <StylesStrip />
        <HowItWorks />
        <CTASection />
      </main>
    </>
  );
}
