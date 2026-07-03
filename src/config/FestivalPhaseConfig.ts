 export const FESTIVAL_PHASE_SEQUENCES: Record<string, { 
  phases: string[], 
  timings: Record<string, number> 
}> = {
  
  // ━━━ DIWALI (Old Working Logic - EXACT MATCH) ━━━
  DIWALI: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 350,        // Old: 350ms ✅
      SHOOTING: 6000,    // Old: 6000ms ✅ (6 sec pura chalna chahiye!)
      HANDOVER: 150      // Old: 150ms ✅
    }
  },

  // ━━━ HOLI (New Logic) ━━━
  HOLI: {
    phases: ['PUCK_PUMP', 'STREAM_BLAST', 'COLOR_BURST', 'GULAL_RAIN', 'HANDOVER', 'FADE_MIST'],
    timings: {
      PUCK_PUMP: 800,
      STREAM_BLAST: 1200,
      COLOR_BURST: 1000,
      GULAL_RAIN: 1500,
      HANDOVER: 800,
      FADE_MIST: 600
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
