import type { Metadata } from "next";
import "./globals.css";
import DisclaimerBanner from "@/components/DisclaimerBanner";

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
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <DisclaimerBanner />
        {children}
      </body>
    </html>
  );
}
