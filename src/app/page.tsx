import Navbar from '@/components/layout/Navbar' // Or '@/components/landing/Navbar' if you moved it
import Hero from '@/components/home/Hero'
// import Counters from '@/components/home/Counters' <--- REMOVED (Moved inside Hero)
import Features from '@/components/home/Features'
import CoreTools from '@/components/home/CoreTools'
import Pricing from '@/components/home/Pricing'
import Testimonials from '@/components/home/Testimonials'
import SupportSection from '@/components/landing/SupportSection'
import Footer from '@/components/home/Footer' // Or '@/components/landing/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      {/* Counters removed to avoid duplication */}
      <Features />
      <CoreTools />
      <Pricing />
      <Testimonials />
      <SupportSection />
      <Footer />
    </div>
  )
}