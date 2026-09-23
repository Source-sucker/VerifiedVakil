import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DisclaimerBanner from "@/components/DisclaimerBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VerifiedVakil — Citation-Locked AI for Legal Assistance & Access",
  description:
    "A citation-locked legal assistant for Indian residential tenants. Simplifies agreements, flags predatory terms, and grounds all advice in verified Indian statutory provisions with zero hallucination.",
  keywords: [
    "VerifiedVakil",
    "Legal AI",
    "Model Tenancy Act 2021",
    "Rental Agreement India",
    "Leave and License",
    "Registration Act 1908",
    "Tenant Rights India",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-[#060a14] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white font-sans">
        <DisclaimerBanner />
        {children}
      </body>
    </html>
  );
}
