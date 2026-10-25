import Hero from '@/components/Hero';
import AboutSection from '@/components/AboutSection';
import CoreFeatures from '@/components/CoreFeatures';
import WorkflowSection from '@/components/WorkflowSection';
import UserCategories from '@/components/UserCategories';
import ModesSection from '@/components/ModesSection';
import TrustSection from '@/components/TrustSection';
import FaqSection from '@/components/FaqSection';
import HomeMotion from '@/components/motion/HomeMotion';

export default function Home() {
  return (
    <div className="relative">
      <Hero />
      <AboutSection />
      <CoreFeatures />
      <WorkflowSection />
      <UserCategories />
      <ModesSection />
      <TrustSection />
      <FaqSection />
      <HomeMotion />
    </div>
  );
}
