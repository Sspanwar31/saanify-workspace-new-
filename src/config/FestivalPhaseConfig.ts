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

// ━━━ RAKSHA_BANDHAN (🚀 12.0s Cinematic Timeline Sync) ━━━
  RAKSHA_BANDHAN: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 1000,     // 1.0s: मंदिर का बैकग्राउंड आना और दीये का जलना (0-1s)
      SHOOTING: 10000, // 10.0s: रेशमी धागा प्रवेश, राखी का निर्माण, एनर्जी पल्स, शील्ड ब्लास्ट और टेक्स्ट आना (1s - 11s)
      HANDOVER: 1000   // 1.0s: स्वर्णिम रेडियल फेड-आउट और डैशबोर्ड पर ट्रांसफर (11s - 12s)
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

  // ━━━ MAKAR_SANKRANTI (🚀 12.0s Dynamic Sky Sequence) ━━━
  MAKAR_SANKRANTI: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 1500,     // 1.5s: शांत नीले आकाश और सिंगल पतंग का आगमन
      SHOOTING: 9500,  // 9.5s: पतंगों का झुंड, डगमगाती हवा की लकीरें और "Makar Sankranti" टेक्स्ट रिवील
      HANDOVER: 1000   // 1.0s: कोमल स्वर्णिम फेड-आउट और डैशबोर्ड पर ट्रांसफर
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

  // ━━━ NEW_YEAR (🚀 13.0s Year Countdown & Firework Sequence) ━━━
  NEW_YEAR: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 1500,     // 1.5s: काउंटडाउन रिंग का आगमन
      SHOOTING: 9500,  // 10.5s: उल्टी गिनती (3-2-1), ईयर मॉर्फ, शानदार आतिशबाज़ी और "Happy New Year" टेक्स्ट रीवील
      HANDOVER: 1000   // 1.0s: कोमल फ़ेड-आउट और डैशबोर्ड पर ट्रांसफर
    }
  },

  // ━━━ VALENTINES_DAY (🚀 12.0s Cinematic Sequence Sync) ━━━
  VALENTINES_DAY: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 1500,     // 1.5s: दो अर्ध-दिलों का आसमान में आगमन
      SHOOTING: 9500,  // 9.5s: दिलों का मिलना, कोमल लव-वेव्स का फैलना, और "Happy Valentine's Day" टेक्स्ट रीवील
      HANDOVER: 1000   // 1.0s: डैशबोर्ड पर स्मूथ फ़ेड-आउट
    }
  },

// ━━━ GANESH_CHATURTHI (🚀 10.5s Snappy & Luxurious Cinematic Timeline Sync) ━━━
  GANESH_CHATURTHI: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 1500,     // 1.5s: धुएं और कोहरे का तेज़ प्रवेश (0-1.5s)
      SHOOTING: 8300,  // 8.3s: गणेश जी का प्रकटीकरण, आरती, घंटियाँ, फूलों की वर्षा और श्लोक (1.5s - 9.8s)
      HANDOVER: 700    // 0.7s: स्वाभाविक कोमल सुनहरे रंग का फ़ेड-आउट और डैशबोर्ड ट्रांसफर (9.8s - 10.5s)
    }
  },

  // ━━━ HANUMAN_JAYANTI (🚀 10.5s Epic & Powerful Cinematic Timeline Sync) ━━━
  HANUMAN_JAYANTI: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 2000,     // 2.0s: लावा ऊर्जा का चक्कर और "राम" नाम का कोमल तैरना (0-2.0s)
      SHOOTING: 7500,  // 7.5s: सोने की अंगूठियां, हनुमान जी का इम्पैक्ट, गेंदे की भारी वर्षा और श्लोक (2.0s - 9.5s)
      HANDOVER: 1000   // 1.0s: कोमल स्वर्णिम पोर्टल का व्हाइट-आउट हैंडओवर (9.5s - 10.5s)
    }
  },

    // ━━━ NAVRATRI (🪷 15.0s Divine Shakti Cinematic Timeline Sync) ━━━
NAVRATRI: {
  phases: ['FLASH', 'REVEAL', 'DISPLAY', 'HANDOVER'],
  timings: {
    FLASH:    2000,   // 2.0s: दिव्य क्रिमसन ऊर्जा, धुएं, मंदिर सिलुएट और शक्ति पल्स का मंद्र प्रवेश (0s - 2.0s)
    REVEAL:   5000,   // 5.0s: माँ दुर्गा का धीमे-धीमे गोलाकार प्रकटीकरण, स्पार्कल्स, लेंस फ्लेयर (2.0s - 7.0s)
    DISPLAY:  4500,   // 4.5s: पूर्ण प्रदर्शन — आरती, घंटियां, दीये, पुष्प वर्षा, कुमकुम, रंगोली, किरणें (7.0s - 11.5s)
    HANDOVER: 3500    // 3.5s: ग्रेसफुल फ़ेड-आउट, "Happy Navratri" टेक्स्ट, शिमर, और डैशबोर्ड ट्रांसफर (11.5s - 15.0s)
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
