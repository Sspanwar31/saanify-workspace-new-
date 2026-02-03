'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Sun, Moon, Zap } from 'lucide-react'; 
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (id: string) => {
    setIsOpen(false); 
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    // FIX 1: z-[9999] ensures Navbar is ALWAYS on top of everything
    <nav className={`fixed top-0 w-full z-[9999] transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
        
        {/* FIX 2: LOGO REVERTED TO SOLID BLUE (Old Style) */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md transition-transform group-hover:scale-105">
            S
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1">
            Saanify <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </span>
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden lg:flex items-center gap-8">
          {['Features', 'Pricing', 'About', 'Testimonials', 'Contact Us'].map((item) => (
             <button 
               key={item}
               onClick={() => handleScrollTo(item.toLowerCase().split(' ')[0])} 
               className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
             >
               {item}
             </button>
          ))}
        </div>

        {/* RIGHT SIDE ACTIONS */}
        <div className="hidden lg:flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-600 hover:bg-slate-100 rounded-full">
             {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>

          <Button 
            variant="ghost" 
            onClick={() => router.push('/login')}
            className="text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-medium"
          >
            Sign In
          </Button>

          <Button 
            onClick={() => handleScrollTo('pricing')}
            className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all"
          >
            Get Started
          </Button>
        </div>

        {/* MOBILE MENU */}
        <div className="flex items-center gap-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
             {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>
          <button className="p-2 text-slate-600" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-slate-100 p-6 lg:hidden shadow-xl flex flex-col gap-4 animate-in slide-in-from-top-5">
          {['Features', 'Pricing', 'About', 'Testimonials', 'Contact Us'].map((item) => (
             <button key={item} onClick={() => handleScrollTo(item.toLowerCase().split(' ')[0])} className="text-left py-2 font-medium text-slate-600">{item}</button>
          ))}
          <div className="h-px bg-slate-100 my-2" />
          <Button onClick={() => router.push('/login')} variant="outline" className="w-full justify-center">Sign In</Button>
          <Button onClick={() => handleScrollTo('pricing')} className="w-full justify-center bg-blue-600 hover:bg-blue-700">Get Started</Button>
        </div>
      )}
    </nav>
  );
}
