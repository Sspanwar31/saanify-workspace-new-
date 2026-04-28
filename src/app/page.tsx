"use client"; // 🚀 Sabse pehle ye line jodein taaki useEffect kaam kare

import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import CoreTools from '@/components/home/CoreTools';
import Pricing from '@/components/home/Pricing';
import Testimonials from '@/components/home/Testimonials';
import SupportSection from '@/components/landing/SupportSection';
import Footer from '@/components/home/Footer';

export default function Home() {
  
  // ✅ THEME SYNC LOGIC
  useEffect(() => {
    // 1. Check karein ki user ne pehle koi preference save ki hai ya nahi
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      // 2. Agar koi preference nahi hai (naya user), toh Landing Page ko hamesha Light dikhao
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    // bg-white ke saath dark:bg-white jodein taaki dark mode class hone par bhi ye light hi dikhe
    <div className="min-h-screen bg-white dark:bg-white text-slate-900 transition-colors duration-300">
      <Navbar />
      <Hero />
      <Features />
      <CoreTools />
      <Pricing />
      <Testimonials />
      <SupportSection />
      <Footer />
    </div>
  )
}
