import { Hero } from "@/components/marketing/Hero";
import { StylesStrip } from "@/components/marketing/StylesStrip";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { CTASection } from "@/components/marketing/CTASection";
import { FeatureRedesign } from "@/components/marketing/FeatureRedesign";
import { FeatureTransfer } from "@/components/marketing/FeatureTransfer";
import { FeatureStaging } from "@/components/marketing/FeatureStaging";
import PricingSection from "@/components/marketing/PricingSection";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import Script from "next/script";

export default function Page() {
  return (
    <>
      <main>
        <Hero />
        <StylesStrip />
        <FeatureRedesign />
        <FeatureTransfer />
        <FeatureStaging />
        <PricingSection />
        <HowItWorks />
        <CTASection />
      </main>
      {/* Organization & WebSite JSON-LD for better rich results */}
      <Script
        id="jsonld-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: config.appName,
            url: "/",
            logo: "/icon.png",
            sameAs: [],
          }),
        }}
      />
      <Script
        id="jsonld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: config.appName,
            url: "/",
            potentialAction: {
              "@type": "SearchAction",
              target: "/blog?search={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
    </>
  );
}

export const metadata = getSEOTags({
  title: `${config.appName} — AI Interior Design & Virtual Staging` ,
  description:
    "Generate photoreal interior redesigns in seconds. Upload a room or start from text. Australian-inspired styles, simple presets, and fast results.",
  canonicalUrlRelative: "/",
});
