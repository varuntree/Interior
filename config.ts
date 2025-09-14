import { ConfigProps } from "./types/config";

const config = {
  // REQUIRED
  appName: "QuickDesignHome",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "Transform your space with AI-powered interior design. Generate beautiful room designs with Australian-inspired styles.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "quickdesignhome.com",
  stripe: {
    // Create multiple plans in your Stripe dashboard, then add them here. You can add as many plans as you want, just make sure to add the priceId
    plans: [
      {
        // REQUIRED — used by webhooks to map the subscribed plan
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1S782TCZJ3iopmxZOw8mbsOV" // Weekly $6.99 (test)
            : "price_1S78OkCZJ3iopmxZpmXhaK1l", // Weekly $6.99 (live)
        //  REQUIRED - Name of the plan, displayed on the pricing page
        name: "Weekly",
        // A friendly description of the plan
        description: "Flexible weekly access to AI interior design",
        // Display price (USD)
        price: 6.99,
        // Optional crossed-out anchor price
        priceAnchor: undefined,
        features: [
          { name: "20 high‑resolution images per month" },
          { name: "4 design modes" },
          { name: "Australian style presets" },
          { name: "Collections & favorites" },
        ],
      },
      {
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1S7832CZJ3iopmxZN96mdDtb" // Monthly $24.99 (test)
            : "price_1S78PJCZJ3iopmxZuoOkwjdl", // Monthly $24.99 (live)
        // This plan will be highlighted on the pricing page.
        isFeatured: true,
        name: "Monthly",
        description: "Best value for power users",
        price: 24.99,
        priceAnchor: undefined,
        features: [
          { name: "100 high‑resolution images per month" },
          { name: "4 design modes" },
          { name: "Australian style presets" },
          { name: "Collections & favorites" },
          { name: "Priority generation queue" },
        ],
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  resend: {
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `QuickDesignHome <noreply@quickdesignhome.com>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `QuickDesignHome Support <support@quickdesignhome.com>`,
    // Email shown to customer if need support.
    supportEmail: "support@quickdesignhome.com",
  },
  colors: {
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..)
    // Matches Theme v2 primary color: hsl(203.8863 88.2845% 53.1373%)
    main: "#47B3FF",
    // REQUIRED — Theme setting for types compatibility
    theme: "light",
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/signin",
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /dashboard, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    callbackUrl: "/dashboard",
  },
} as ConfigProps;

export default config;
