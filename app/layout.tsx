import { ReactNode } from "react";
import { Viewport } from "next";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import config from "@/config";
import { Open_Sans } from "next/font/google";
import "./globals.css";

// Typography is driven via CSS tokens in globals.css (--font-sans, etc.).

export const viewport: Viewport = {
	// Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
	themeColor: config.colors.main,
	width: "device-width",
	initialScale: 1,
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags();

const openSans = Open_Sans({ subsets: ["latin"], display: "swap" });

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning className={openSans.className}>
			<body className="font-sans">
				{/* ClientLayout contains the client wrappers (theme, toasts, loading bar) */}
				<ClientLayout>{children}</ClientLayout>
			</body>
		</html>
	);
}
