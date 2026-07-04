export const FESTIVAL_PHASE_SEQUENCES: Record<string, { 
  phases: string[], 
  timings: Record<string, number> 
}> = {
  
  // ━━━ DIWALI (DO NOT TOUCH) ━━━
  DIWALI: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 350,        
      SHOOTING: 6000,    
      HANDOVER: 150      
    }
  },

 / // ━━━ HOLI (🚀 FIXED: Aligned 1.4s Rocket Flight & Blast Sync) ━━━
  HOLI: {
    phases: ['ROCKET_LAUNCH', 'COLOR_DHAMAKA', 'GULAL_RAIN', 'HANDOVER'],
    timings: {
      ROCKET_LAUNCH: 1400,   // 🚀 FIXED: 3200 से घटाकर 1400 किया (रॉकेट्स ऊपर पहुँचते ही बिना रुके तुरंत फटेंगे)
      COLOR_DHAMAKA: 2500,  // सघन धमाका और रंगीन बौछार
      GULAL_RAIN: 4000,     // कोमल रंगीन बारिश
      HANDOVER: 150          
    }
  },
  
  // ━━━ GENERIC FALLBACK ━━━
  DEFAULT: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 350,
      SHOOTING: 6000,
      HANDOVER: 150
    }
  }
};
