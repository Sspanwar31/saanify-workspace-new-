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

 // ━━━ HOLI (🚀 FIXED: Aligned Standard Phase Names & 2.9s Perfect Sync) ━━━
  HOLI: {
    phases: ['FLASH', 'ROCKET', 'FIREWORK', 'HANDOVER'], // 🚀 FIXED: Standard names taaki engine inhe pehchan sake
    timings: {
      FLASH: 600,        // Shuruat ka color flash
      ROCKET: 2900,      // 🚀 FIXED: Bilkul sateek 2.9 seconds (Rockets ke upar pahuchne aur adrishya hone ka sateek samay)
      FIREWORK: 2500,    // 🚀 Gulaal dhamaka aur particles ka bikharna
      HANDOVER: 500      
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
