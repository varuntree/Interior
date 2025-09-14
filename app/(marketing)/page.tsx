import { Hero } from "@/components/marketing/Hero";
import { StylesStrip } from "@/components/marketing/StylesStrip";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { CTASection } from "@/components/marketing/CTASection";
import { FeatureRedesign } from "@/components/marketing/FeatureRedesign";
import { FeatureTransfer } from "@/components/marketing/FeatureTransfer";
import { FeatureStaging } from "@/components/marketing/FeatureStaging";

export default function Page() {
  return (
    <>
      <main>
        <Hero />
        <StylesStrip />
        <FeatureRedesign />
        <FeatureTransfer />
        <FeatureStaging />
        <HowItWorks />
        <CTASection />
      </main>
    </>
  );
}
