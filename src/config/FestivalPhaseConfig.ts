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

 // ━━━ HOLI (🚀 FIXED: Perfect Rocket Flight & Staggered Blasts) ━━━
  HOLI: {
    phases: ['ROCKET_LAUNCH', 'COLOR_DHAMAKA', 'TEXT_REVEAL', 'GULAL_RAIN', 'HANDOVER'],
    timings: {
      ROCKET_LAUNCH: 3500,   // 🚀 Sab rockets udenge, upar jayenge, aur blast honge
      COLOR_DHAMAKA: 1500,   // 💥 Blast ka aftermath dikhega
      GULAL_RAIN: 3500,      // 🌈 Gulal baarish
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
