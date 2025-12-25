'use client';

import Link from 'next/link';
import { Mail, MapPin, Twitter, Linkedin, Instagram } from 'lucide-react';

export default function Footer() {
  
  // Smooth Scroll Helper
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 py-16 border-t border-slate-800">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* COLUMN 1: BRAND INFO */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                S
              </div>
              <span className="text-2xl font-bold text-white">Saanify</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Premium financial management solution for modern cooperative societies. 
              Streamline operations, enhance compliance, and drive growth.
            </p>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-blue-500" />
                <a href="mailto:contact@saanify.com">contact@saanify.com</a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>Mumbai, India</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: PRODUCT (Active Scroll Links) */}
          <div>
            <h3 className="text-white font-bold mb-6">Product</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <a 
                  href="#features" 
                  onClick={(e) => handleScroll(e, 'features')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Features
                </a>
              </li>
              <li>
                <a 
                  href="#pricing" 
                  onClick={(e) => handleScroll(e, 'pricing')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a 
                  href="#testimonials" 
                  onClick={(e) => handleScroll(e, 'testimonials')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Success Stories
                </a>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: COMPANY (Active Scroll Links) */}
          <div>
            <h3 className="text-white font-bold mb-6">Company</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <a 
                  href="#about" 
                  onClick={(e) => handleScroll(e, 'about')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  About Us
                </a>
              </li>
              <li>
                <a 
                  href="#contact" 
                  onClick={(e) => handleScroll(e, 'contact')}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: LEGAL (Refund Policy Removed) */}
          <div>
            <h3 className="text-white font-bold mb-6">Legal</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-blue-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Saanify. All rights reserved.
          </p>
          
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
               <Twitter className="w-4 h-4" />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
               <Linkedin className="w-4 h-4" />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
               <Instagram className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}