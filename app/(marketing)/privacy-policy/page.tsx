import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Privacy Policy | ${config.appName}`,
  canonicalUrlRelative: "/privacy-policy",
});

const PrivacyPolicy = () => {
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
          </svg>{" "}
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Privacy Policy for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Last Updated: September 15, 2025

This Privacy Policy explains how QuickDesignHome ("QuickDesignHome", "we", "us") collects, uses, and protects information when you use https://quickdesignhome.com and related services (the "Service"). By using the Service, you agree to this policy.

1) Information We Collect

• Account data: email address and basic profile info needed to create and secure your account.
• Billing data: payment method details are processed by our payment provider (Stripe) and are not stored on our servers. We retain non-sensitive billing metadata (e.g., Stripe customer/price IDs) to manage subscriptions.
• Content you provide: room photos and other images you upload, prompts/text you enter, and preferences such as selected room type and style.
• Generated outputs: images produced by the Service and basic metadata (mode, timestamps).
• Technical data: IP address, device and browser info, cookies, and usage logs necessary for security, fraud prevention, analytics, and improving the Service.

2) How We Use Information

• Provide and improve the Service, including processing your uploads to generate designs.
• Operate subscriptions, billing, and customer support.
• Enforce plan limits and prevent abuse.
• Communicate important updates (service, policy, billing).

3) Service Providers and Data Sharing

We use vetted providers to operate the Service:
• Supabase for authentication, database, and storage of your uploads/outputs (with row‑level security).
• Stripe for payments and subscription management.
• Replicate to run the AI model that generates images from your inputs.
We share only what is necessary for them to perform their services. We do not sell your personal data.

4) Your Images and Generated Outputs

• Private by default: your uploads and generated images are private to your account unless you choose to share or publish them (e.g., adding items to a public community gallery when that feature is enabled).
• Access and deletion: you can delete your generated images from within the app. Deleting does not affect any images you have explicitly published to public areas.

5) Cookies and Analytics

We use cookies and similar technologies to keep you signed in, remember preferences, and measure usage. You can control cookies via your browser settings; the Service may not function correctly without required cookies.

6) Data Retention

We retain account and generation records as long as you maintain an account and as needed for legal, accounting, or security purposes. You may request deletion of your account by contacting support.

7) Children’s Privacy

The Service is not directed to children under 13. We do not knowingly collect personal data from children.

8) Security

We implement reasonable administrative, technical, and organizational measures to protect your data. No system is perfectly secure; please use strong, unique passwords and keep them confidential.

9) International Users

Our Service may process data in regions where our providers operate. By using the Service, you consent to such processing and transfer.

10) Changes to This Policy

We may update this policy to reflect changes to the Service or applicable laws. Material changes will be notified in‑app or by email.

11) Contact Us

Email: support@quickdesignhome.com
Address/owner information available upon request.

Using QuickDesignHome means you consent to this Privacy Policy.`}
        </pre>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
