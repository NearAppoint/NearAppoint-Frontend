import { Hero } from '@/components/marketing/hero';
import {
  StatsBar, Categories, Steps, Features, ForBusiness,
  MobileApp, Benefits, NavyStats, Testimonials, Faq, FinalCta,
} from '@/components/marketing/sections';

/**
 * The landing page. Eleven sections, each a component, each fed by typed data
 * from src/constants/marketing.ts.
 *
 * The page itself is a table of contents. That is what it should be.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <Categories />
      <Steps />
      <Features />
      <ForBusiness />
      <MobileApp />
      <Benefits />
      <NavyStats />
      <Testimonials />
      <Faq />
      <FinalCta />
    </>
  );
}
