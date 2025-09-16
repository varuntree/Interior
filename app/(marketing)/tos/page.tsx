import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// NOTE: To regenerate Terms & Conditions, adjust the prompt below with QuickDesignHome details.
// - Website: https://quickdesignhome.com
// - Name: QuickDesignHome
// - Contact information: support@quickdesignhome.com
// - Description: AI-powered interior design generator for Australian-inspired spaces
// - Ownership: subscribers may download generated images for personal/commercial use but may not resell the service itself
// - User data collected: email, payment information, uploaded room photos, prompts
// - Non-personal data collection: analytics and cookies for performance and security
// - Link to privacy policy: https://quickdesignhome.com/privacy-policy
// - Governing Law: New South Wales, Australia
// - Updates to the Terms: notified via email or in-app announcement

export const metadata = getSEOTags({
  title: `Terms and Conditions | ${config.appName}`,
  canonicalUrlRelative: "/tos",
});

const TOS = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Terms and Conditions for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Last Updated: September 15, 2025

Welcome to QuickDesignHome ("QuickDesignHome", "we", "us"). These Terms of Service ("Terms") govern your access to and use of https://quickdesignhome.com and related services (the "Service"). By using the Service, you agree to these Terms.

1) Service Overview

QuickDesignHome provides an AI-powered interior design generator. Users can upload room photos or provide text prompts to generate photorealistic redesigns and organize results in their account.

2) Accounts and Eligibility

You must be at least 13 years old and capable of forming a binding contract to use the Service. You are responsible for safeguarding your account credentials and for all activity under your account.

3) Your Content and License to Us

"User Content" includes images you upload (e.g., room photos) and any text prompts or settings you provide. You retain ownership of your User Content. You grant QuickDesignHome a non-exclusive, worldwide, royalty-free license to host, process, and display your User Content solely to operate and improve the Service. If you choose to publish content to public areas (e.g., community galleries), you additionally grant us a license to display, reproduce, and distribute that content for the purpose of operating those public features.

4) Generated Outputs and Usage

Subject to these Terms and applicable law, you may use the images generated for you (the "Outputs") for personal and commercial purposes. You are responsible for ensuring your use of Outputs complies with applicable laws and third-party rights (e.g., trademarks, privacy, property, or design rights). We do not guarantee that Outputs will be unique or free from similarity to other content.

5) Acceptable Use

You agree not to use the Service to create, upload, or share content that is illegal, harmful, or violates others' rights, including content that is explicit, hateful, harassing, or that depicts criminal activity. You may not attempt to bypass plan limits, probe or disrupt our systems, or reverse engineer components of the Service.

6) Plans, Billing, and Taxes

Paid access is provided via subscription plans listed on our website. Prices and features are subject to change with notice. Payments are processed by Stripe; by purchasing a plan, you agree to Stripe's terms. Taxes may be added where required. Plan limits (e.g., monthly generation caps, concurrency) are enforced as described on the pricing page and within the app.

7) Refunds and Cancellations

You can cancel future renewals at any time via the billing portal link in the app. Where required by law, you may be entitled to a refund; otherwise refunds are handled case-by-case. Contact support@quickdesignhome.com if you believe you were charged in error.

8) Third-Party Services

We rely on third parties, including Supabase (auth, database, storage), Stripe (payments), and Replicate (AI inference). Their services are subject to their own terms, and your use of the Service constitutes acceptance that we may process your data with them to operate the Service.

9) Disclaimers

The Service and Outputs are provided "as is" without warranties of any kind. We do not warrant uninterrupted or error-free operation or that Outputs will meet your expectations.

10) Limitation of Liability

To the maximum extent permitted by law, QuickDesignHome will not be liable for indirect, incidental, special, consequential, or exemplary damages, or for loss of profits, goodwill, or data. Our aggregate liability relating to the Service will not exceed the amounts you paid to us in the 3 months preceding the claim.

11) Termination

We may suspend or terminate access if you violate these Terms or misuse the Service. You may stop using the Service at any time.

12) Changes to These Terms

We may update these Terms from time to time. Material changes will be notified in-app or by email. Continued use after changes constitutes acceptance.

13) Governing Law

These Terms are governed by the laws of New South Wales, Australia, without regard to its conflict of laws principles. The exclusive venue for disputes is the state or federal courts located in New South Wales, Australia.

14) Contact

support@quickdesignhome.com
Address/owner information available upon request.`}
        </pre>
      </div>
    </main>
  );
};

export default TOS;
