'use client';



import HeroFactory from '@/components/festival/v2/HeroFactory';

import { ShieldCheck, X } from 'lucide-react';

import { Button } from '@/components/ui/button';



interface BroadcastPopupProps {

  broadcast: any;

  onClose: () => void;

}



export default function BroadcastPopup({

  broadcast,

  onClose,

}: BroadcastPopupProps) {

  if (!broadcast) return null;



  const themeColor =

    broadcast.theme_config?.primary_color ||

    broadcast.theme_color ||

    '#fbbf24';



  const themeGradient = `linear-gradient(135deg, ${themeColor} 0%, #020617 100%)`;



  const titleParts =

    (broadcast.resolved_title || broadcast.title)?.split('|') || [];



  const msgParts =

    (broadcast.resolved_message || broadcast.message)?.split('|') || [];



  const designPreset =

    broadcast.hero_config?.design_preset || 'standard';



  const titleVariant =

    broadcast.theme_config?.title_variant || 'royal';



  const ctaVariant =

    broadcast.theme_config?.cta_variant || 'premium';



  const bannerVariant =

    broadcast.theme_config?.banner_variant || 'glass';



  const cardGlow =

    broadcast.theme_config?.card_glow || 'theme';



  const titleStyles: any = {

    royal: 'font-black italic tracking-tight',

    modern: 'font-bold tracking-wide',

    minimal: 'font-semibold tracking-normal',

    gradient: 'font-black bg-clip-text text-transparent',

    glow: 'font-black drop-shadow-[0_0_20px_currentColor]',

  };



  const cardClasses: any = {

    glass: 'bg-[#0a0f1e]/90 backdrop-blur-3xl',

    premium: 'bg-[#0a0f1e]',

    luxury: 'bg-gradient-to-br from-black via-slate-900 to-black',

    royal: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',

    minimal: 'bg-[#111827]',

    festival: 'bg-gradient-to-br from-slate-950 to-black',

  };



  const getGlow = () => {

    switch (cardGlow) {

      case 'gold':

        return '0 0 80px rgba(251,191,36,.4)';

      case 'white':

        return '0 0 80px rgba(255,255,255,.25)';

      case 'premium':

        return `0 0 120px ${themeColor}55`;

      case 'none':

        return 'none';

      default:

        return `0 0 80px ${themeColor}30`;

    }

  };



  const getCTAStyle = () => {

    switch (ctaVariant) {

      case 'glass':

        return {

          background: 'rgba(255,255,255,0.1)',

          backdropFilter: 'blur(20px)',

          color: 'white',

        };



      case 'solid':

        return {

          background: themeColor,

          color: '#020617',

        };



      case 'gradient':

        return {

          background: `linear-gradient(135deg,${themeColor},#ffffff)`,

          color: '#020617',

        };



      case 'neon':

        return {

          background: themeColor,

          color: '#020617',

          boxShadow: `0 0 30px ${themeColor}`,

        };



      default:

        return {

          background: themeGradient,

          color: 'white',

        };

    }

  };



  return (

    <div className="relative min-h-[650px] flex items-center justify-center">



      {/* CARD */}

      <div className="relative w-full max-w-[320px] z-50">



        <div

          className={`relative rounded-[3rem] overflow-hidden flex flex-col border-[3px]

          shadow-[0_50px_120px_rgba(0,0,0,0.9)]

          ${cardClasses[bannerVariant]}`}

          style={{

            borderColor: themeColor,

            boxShadow: getGlow(),

          }}

        >



          {/* CLOSE */}

          <button

            onClick={onClose}

            className="absolute top-6 right-6 z-50 text-white/40 hover:text-white"

          >

            <X className="w-6 h-6" />

          </button>



          {/* HERO */}

          <div className="relative w-full h-[320px] overflow-hidden flex items-center justify-center bg-slate-950/50 p-6 pt-16">



            {broadcast.image_url ? (

              <img

                src={broadcast.image_url}

                alt="Hero"

                className="w-full h-full object-contain relative z-10 drop-shadow-2xl"

              />

            ) : (

              <HeroFactory

                config={broadcast.hero_config}

                themeColor={themeColor}

              />

            )}



            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent z-20" />

          </div>



          {/* CONTENT */}

          <div className="p-8 pt-0 text-center relative z-30 flex flex-col items-center">



            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center mb-6 shadow-2xl rotate-3">



              <ShieldCheck

                className="w-8 h-8"

                style={{ color: themeColor }}

              />

            </div>



            <h1

              className={`text-3xl uppercase leading-none drop-shadow-lg ${titleStyles[titleVariant]}`}

              style={{

                color:

                  titleVariant !== 'gradient'

                    ? themeColor

                    : undefined,



                background:

                  titleVariant === 'gradient'

                    ? `linear-gradient(90deg, ${themeColor}, white)`

                    : undefined,

              }}

            >

              {titleParts[0]}

            </h1>



            <p className="mt-4 text-slate-300 text-[13px] font-medium leading-relaxed px-2 opacity-80">

              {msgParts[0]}

            </p>



            <Button

              onClick={onClose}

              className="w-full h-14 mt-8 rounded-[1.5rem] text-lg font-black shadow-2xl hover:scale-105 transition-all"

              style={getCTAStyle()}

            >

              {broadcast.resolved_cta || 'CONTINUE'}

            </Button>



            <div className="mt-5 text-[9px] uppercase tracking-[4px] font-bold opacity-40 text-white">

              Premium Saanify Greeting

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}
