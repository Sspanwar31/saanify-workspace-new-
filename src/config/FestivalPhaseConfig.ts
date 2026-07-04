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

  // ━━━ HOLI (New "Rocket -> Dhamaka -> Rain" Story) ━━━
  HOLI: {
    phases: ['ROCKET_LAUNCH', 'COLOR_DHAMAKA', 'GULAL_RAIN', 'HANDOVER'],
    timings: {
      ROCKET_LAUNCH: 800,   // Beam upar jayega
      COLOR_DHAMAKA: 1500,  // Phatkega (Dhamaka!)
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
