import { BlurInHeadline } from "@/components/blur-in-headline";
import { ContactOffer } from "@/components/contact-offer";
import { Problem } from "@/components/problem";
import { Stats } from "@/components/stats";
import { FAQ } from "@/components/faq";
import { FeaturesBento } from "@/components/features-bento";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Pricing } from "@/components/pricing";
import { Providers } from "@/components/providers";
import { SkipToContent } from "@/components/skip-to-content";
import { ThemeSwitch } from "@/components/theme-switch";
import type { ReactNode } from "react";

export default function LandingPage(): ReactNode {
  return (
    <Providers>
      <div className="site-frame site-frame--top" aria-hidden="true" />
      <div className="site-frame site-frame--bottom" aria-hidden="true" />
      <div className="site-frame site-frame--left" aria-hidden="true" />
      <div className="site-frame site-frame--right" aria-hidden="true" />

      <svg className="site-corner site-corner--top-left" width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
        <path d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z" fill="currentColor"/>
      </svg>
      <svg className="site-corner site-corner--top-right" width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
        <path d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z" fill="currentColor"/>
      </svg>
      <svg className="site-corner site-corner--bottom-left" width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
        <path d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z" fill="currentColor"/>
      </svg>
      <svg className="site-corner site-corner--bottom-right" width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
        <path d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z" fill="currentColor"/>
      </svg>

      <Header />
      <ThemeSwitch />
      <SkipToContent />

      <main id="main-content" className="flex-1">
        <Hero />
        <BlurInHeadline />
        <Problem />
        <FeaturesBento />
        <Stats />
        {/* <Testimonials /> */}
        <HowItWorks />
        <Pricing />
        <ContactOffer />
        <FAQ />
        <Footer />
      </main>
    </Providers>
  );
}
