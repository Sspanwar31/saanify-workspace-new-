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

  // ━━━ HOLI (🚀 FIXED TIMELINE SYNC FOR ROCKETS & BLAST) ━━━
  HOLI: {
    phases: ['ROCKET_LAUNCH', 'COLOR_DHAMAKA', 'GULAL_RAIN', 'HANDOVER'],
    timings: {
      ROCKET_LAUNCH: 3200,   // 🚀 FIXED: 800 से बढ़ाकर 3200 किया (रॉकेट्स को आसमान के शीर्ष तक पहुँचने का पूरा समय मिलेगा)
      COLOR_DHAMAKA: 2500,  // 🚀 FIXED: 1500 से बढ़ाकर 2500 किया (ताकि आतिशबाज़ी के फटने और बिखरने का पूरा आनंद दिखे)
      GULAL_RAIN: 4000,     // Beautiful neon rain giregi
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
