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

  // ━━━ HOLI (DO NOT TOUCH) ━━━
  HOLI: {
    phases: ['ROCKET_LAUNCH', 'COLOR_DHAMAKA','GULAL_RAIN', 'HANDOVER'],
    timings: {
      ROCKET_LAUNCH: 3500,   
      COLOR_DHAMAKA: 1500,   
      GULAL_RAIN: 3500,      
      HANDOVER: 150          
    }
  },

  CHRISTMAS: {
  phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
  timings: {
    FLASH: 1000,
    SHOOTING: 12000,
    HANDOVER: 1000
  }
},

// ━━━ RAKSHA_BANDHAN (🚀 12.0s Cinematic Sequence Sync) ━━━
  RAKSHA_BANDHAN: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 1500,     // 1.5s: पवित्र धागे का स्क्रीन पर तैरना
      SHOOTING: 9500,  // 9.5s: गाँठ बांधना, सुनहरी प्रकाश रिंग्स, और राखी का खिलना
      HANDOVER: 1000   // 1.0s: डैशबोर्ड पर स्मूथ फ़ेड-आउट
    }
  },
  
  // ━━━ RAM_NAVAMI (🚀 1.5s Bow Charge + 3.0s Arrow Shoot & Rays) ━━━
  RAM_NAVAMI: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 1500,     // 1.5s: दिव्य धनुष का आगमन
      SHOOTING: 3000,  // 3.0s: तीर छूटेगा और स्वर्णिम किरणें फैलेंगी
      HANDOVER: 1000
    }
  },

  // ━━━ EID_UL_FITR & EID_AL_ADHA ━━━
  EID_UL_FITR: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 1500,     // 1.5s: चाँद का आगमन
      SHOOTING: 3000,  // 3.0s: हरी चंद्र किरणों का विस्तार
      HANDOVER: 1000
    }
  },
  EID_AL_ADHA: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 1500,
      SHOOTING: 3000,
      HANDOVER: 1000
    }
  },

  // ━━━ PATRIOTIC DAYS ━━━
  REPUBLIC_DAY: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 1500,
      SHOOTING: 3000,
      HANDOVER: 1000
    }
  },
  INDEPENDENCE_DAY: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 1500,
      SHOOTING: 3000,
      HANDOVER: 1000
    }
  },

  // ━━━ LOHRI (🚀 13.0s Cinematic Sequence Sync) ━━━
  LOHRI: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 1500,     // 1.5s: रात का आसमान और कोहरा प्रकट होना
      SHOOTING: 10500, // 10.5s: अलाव का जलना, अदम्य चिंगारियां, और "HAPPY LOHRI" टेक्स्ट रिवील
      HANDOVER: 1000   // 1.0s: डैशबोर्ड पर स्मूथ फ़ेड-आउट
    }
  },

  // ━━━ GENERIC FALLBACK (🚀 FIXED: 1.5s + 3.5s + 1.0s for luxurious pacing) ━━━
  DEFAULT: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 1500,    // 0.35s से बढ़ाकर 1.5s किया गया ताकि कोई झटका न लगे
      SHOOTING: 3500, // 3.5s एक्शन और बैकग्राउंड रेंडरिंग
      HANDOVER: 1000  // 1.0s स्मूथ हैंडओवर
    }
  }
};
