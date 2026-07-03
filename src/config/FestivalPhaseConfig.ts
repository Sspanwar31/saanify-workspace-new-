// src/config/FestivalPhaseConfig.ts

export const FESTIVAL_PHASE_SEQUENCES: Record<string, { 
  phases: string[], 
  timings: Record<string, number> 
}> = {
  
  // ━━━ DIWALI (Old Logic - Safe) ━━━
  DIWALI: {
    phases: ['ROCKET', 'FIREWORK', 'FLASH', 'HANDOVER'],
    timings: {
      ROCKET: 1200,
      FIREWORK: 1500,
      FLASH: 800,
      HANDOVER: 1000
    }
  },

  // ━━━ HOLI (New 2027 Logic) ━━━
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
    phases: ['SHOOTING', 'FLASH', 'HANDOVER'],
    timings: {
      SHOOTING: 1500,
      FLASH: 1000,
      HANDOVER: 1000
    }
  }
};
