export const FESTIVAL_PHASE_SEQUENCES: Record<string, { 
  phases: string[], 
  timings: Record<string, number> 
}> = {
  
  // ━━━ DIWALI (Old Working Logic - EXACT MATCH - DO NOT TOUCH) ━━━
  DIWALI: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 350,        
      SHOOTING: 6000,    
      HANDOVER: 150      
    }
  },

  // ━━━ HOLI (New 2027 "First Person Attack" Logic) ━━━
  HOLI: {
    phases: ['APPROACHING', 'IMPACT', 'SMOKE_FILL', 'TEXT_REVEAL', 'HANDOVER'],
    timings: {
      APPROACHING: 1200, // Gutke aate hain
      IMPACT: 400,       // Phat te hain
      SMOKE_FILL: 1900,  // Dhua dhak leta hai
      TEXT_REVEAL: 1500, // Happy Holi aata hai
      HANDOVER: 200      // Popup ke liye ready
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
