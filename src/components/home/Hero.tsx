'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, LogIn, CheckCircle2, 
  BarChart3, PieChart, Calculator, ShieldCheck, Lock, Users 
} from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    tag: "💰 Smart Finance",
    title: "Smarter Society Finance",
    desc: "Transform your financial operations with AI-powered insights and real-time analytics that drive better decisions.",
    color: "blue",
    gradient: "from-blue-600 to-indigo-600",
    bg: "bg-blue-500/10",
    text: "text-blue-600"
  },
  {
    id: 2,
    tag: "⚡ Automation",
    title: "Automated Deposits & Loans",
    desc: "Streamline your financial processes with intelligent automation that handles deposits, loans, and transactions seamlessly.",
    color: "emerald",
    gradient: "from-emerald-500 to-green-600",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600"
  },
  {
    id: 3,
    tag: "🔒 Security",
    title: "Compliance-Ready Accounting",
    desc: "Stay compliant with automated reporting, audit trails, and enterprise-grade security that meets industry standards.",
    color: "purple",
    gradient: "from-purple-600 to-violet-600",
    bg: "bg-purple-500/10",
    text: "text-purple-600"
  }
];

function DynamicVisual({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="relative w-full h-[400px] flex items-center justify-center perspective-1000">
      <AnimatePresence mode='wait'>
        
        {activeIndex === 0 && (
          <motion.div
            key="visual-1"
            initial={{ opacity: 0, rotateY: 20, x: 50 }}
            animate={{ opacity: 1, rotateY: 0, x: 0 }}
            exit={{ opacity: 0, rotateY: -20, x: -50 }}
            transition={{ duration: 0.6 }}
            className="relative w-[320px] sm:w-[380px] bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-2xl shadow-blue-500/20"
          >
            {/* Same Dashboard Code */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="h-2 w-20 bg-slate-200 rounded mb-1"/>
                <div className="h-4 w-32 bg-slate-800 rounded"/>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <BarChart3 size={20}/>
              </div>
            </div>
            <div className="flex items-end justify-between h-32 gap-2 mb-6">
              {[40, 70, 50, 90, 60].map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.2 + (i * 0.1), duration: 1 }}
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg opacity-80"
                />
              ))}
            </div>
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -right-6 -bottom-6 bg-indigo-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3"
            >
              <PieChart className="w-6 h-6"/>
              <div>
                <p className="text-[10px] opacity-80">Revenue</p>
                <p className="text-sm font-bold">+124.5K</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeIndex === 1 && (
          <motion.div
            key="visual-2"
            initial={{ opacity: 0, rotateX: -20, y: 50 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, rotateX: 20, y: -50 }}
            transition={{ duration: 0.6 }}
            className="relative w-[300px] bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-6 shadow-2xl shadow-emerald-500/30 text-white"
          >
             {/* Calculator Visual */}
            <div className="flex justify-between items-start mb-8">
              <Calculator className="w-12 h-12 opacity-80"/>
              <div className="text-right">
                <p className="text-xs opacity-70">Auto-Calculation</p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold font-mono">₹ 50,000</motion.p>
              </div>
            </div>
            <div className="space-y-3">
               {[1, 2, 3].map((i) => (
                 <motion.div key={i} initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }} className="h-2 bg-white/20 rounded-full"/>
               ))}
            </div>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} className="absolute -left-6 top-1/2 bg-white text-emerald-600 p-3 rounded-xl shadow-lg flex items-center gap-2">
               <CheckCircle2 className="w-5 h-5"/>
               <span className="text-sm font-bold">Done!</span>
            </motion.div>
          </motion.div>
        )}

        {activeIndex === 2 && (
          <motion.div
            key="visual-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Security Visual */}
            <div className="w-64 h-72 bg-gradient-to-b from-purple-100 to-white/50 backdrop-blur-md border-4 border-purple-200 rounded-[3rem] flex items-center justify-center shadow-2xl">
               <ShieldCheck className="w-32 h-32 text-purple-600 drop-shadow-lg"/>
            </div>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 z-[-1]">
               <div className="absolute -top-4 left-1/2 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg"><Lock size={20}/></div>
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-2 rounded-full shadow-xl whitespace-nowrap">
              <p className="text-sm font-bold flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/> Bank-Grade SSL</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const router = useRouter(); 

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5000); 
    return () => clearInterval(timer);
  }, []);

  const handleGetStarted = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/payment');
    }
  };

  const handleSignIn = () => {
    router.push('/login'); 
  };

  return (
    // FIX 3: Added z-0 to ensure Hero is strictly below the z-[9999] Navbar
    // FIX 4: Added pt-24 to create proper gap between header and hero section
    <section className="relative w-full min-h-screen flex items-center bg-slate-50 overflow-hidden z-0 pt-24">
      
      <div className="absolute inset-0 pointer-events-none">
         <div className={`absolute top-0 right-0 w-[600px] h-[600px] bg-${SLIDES[current].color}-400/10 blur-[100px] rounded-full transition-colors duration-1000`}/>
         <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] bg-${SLIDES[current].color}-600/10 blur-[100px] rounded-full transition-colors duration-1000`}/>
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10 py-12 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* LEFT: CONTENT */}
            <div>
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-6 ${SLIDES[current].bg} ${SLIDES[current].text}`}>
                       {SLIDES[current].tag}
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.15] mb-6">
                      {SLIDES[current].title.split(' ').slice(0, -1).join(' ')} <br/>
                      <span className={`text-transparent bg-clip-text bg-gradient-to-r ${SLIDES[current].gradient}`}>
                        {SLIDES[current].title.split(' ').slice(-1)}
                      </span>
                    </h1>

                    <p className="text-xl text-slate-600 leading-relaxed max-w-lg mb-8">
                       {SLIDES[current].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <button onClick={handleGetStarted} className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                        Get Started Free <ArrowRight className="w-4 h-4"/>
                    </button>
                    <button onClick={handleSignIn} className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all">
                        <LogIn className="w-4 h-4"/> Sign In
                    </button>
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-500 font-medium mb-10">
                   <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-600"/> <span>1000+ Societies</span></div>
                   <div className="w-1 h-1 bg-slate-300 rounded-full"/>
                   <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-600"/> <span>ISO Certified</span></div>
                </div>

                <div className="flex gap-4">
                   {SLIDES.map((_, index) => (
                      <div key={index} onClick={() => setCurrent(index)} className="h-1 flex-1 bg-slate-200 rounded-full overflow-hidden cursor-pointer hover:bg-slate-300 transition-colors">
                         {index === current && (<motion.div layoutId="progress" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 5, ease: "linear" }} className={`h-full bg-gradient-to-r ${SLIDES[current].gradient}`}/>)}
                      </div>
                   ))}
                </div>
            </div>

            {/* RIGHT: ANIMATED VISUALS */}
            <div className="hidden lg:block">
               <DynamicVisual activeIndex={current} />
            </div>

        </div>
      </div>
    </section>
  );
}