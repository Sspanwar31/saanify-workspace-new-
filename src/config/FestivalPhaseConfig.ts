export const FESTIVAL_PHASE_SEQUENCES: Record<string, { 
  phases: string[], 
  timings: Record<string, number> 
}> = {
  
  // ━━━ DIWALI (🚀 16.0s Extended Video & 3D Gold Text Sync) ━━━
  DIWALI: {
    phases: ['FLASH', 'SHOOTING', 'TEXT', 'HANDOVER'],
    timings: {
      FLASH: 500,        // 0.5s Initial Flash
      SHOOTING: 10000,   // 10.0s Diwali Video Playback
      TEXT: 5500,        // 🚀 5.5s 3D Gold "शुभ दीपावली / HAPPY DIWALI 2027" Greeting
      HANDOVER: 1000     // 1.0s Dashboard Transfer
    }
  },


// ━━━ HOLI (🚀 18.0s Complete Cinematic Sync: Video -> Text -> Greeting -> Rocket Blast -> Gulal Rain) ━━━
  HOLI: {
    phases: ['VIDEO_INTRO', 'TEXT_REVEAL', 'GREETING_MODAL', 'ROCKET_LAUNCH', 'COLOR_DHAMAKA', 'GULAL_RAIN', 'HANDOVER'],
    timings: {
      VIDEO_INTRO: 8500,     // 1. 0.0s - 8.5s: राधा-कृष्ण वृंदावन 3D वीडियो प्लेबैक
      TEXT_REVEAL: 3500,     // 2. 8.5s - 12.0s: 3D लिक्विड गोल्ड "बुरा न मानो होली है / Happy Holi" टेक्स्ट
      GREETING_MODAL: 4000,  // 3. 12.0s - 16.0s: होली ग्रीटिंग कार्ड / विशेस पढ़ने का समय
      ROCKET_LAUNCH: 2000,   // 4. 16.0s - 18.0s: 5 रंगीन रॉकेट्स का आसमान में जाना
      COLOR_DHAMAKA: 1500,   // 5. 18.0s - 19.5s: महा-कलर ब्लास्ट (360° Powder Explosion)
      GULAL_RAIN: 3500,      // 6. 19.5s - 23.0s: हवा में तैरते गुलाल और स्पार्कल्स पार्टिकल्स
      HANDOVER: 1000         // 7. 23.0s - 24.0s: डैशबोर्ड पर स्मूथ ट्रांसफर
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

// ━━━ RAKSHA_BANDHAN (🚀 16.5s Standalone Cinematic Video & Gold Text Sync) ━━━
  RAKSHA_BANDHAN: {
    phases: ['VIDEO_INTRO', 'HANDOVER'],
    timings: {
      VIDEO_INTRO: 16500, // 👈 Pura 16.5s Video + Text + Petals intro component khud handle karega
      HANDOVER: 1000      // 👈 Smooth 1.0s Dashboard Transfer
    }
  },

  // ━━━ JANMASHTAMI (🚀 16.5s Standalone 3D Matki Phod Video & Divine Gold Text Sync) ━━━
  JANMASHTAMI: {
    phases: ['VIDEO_INTRO', 'HANDOVER'],
    timings: {
      VIDEO_INTRO: 16500, // 👈 10.0s 3D Dahi Handi Video + 5.5s Peacock Feathers & Gold Text + 1.0s Fade
      HANDOVER: 1000      // 👈 Smooth 1.0s Dashboard Transfer
    }
  },
  KRISHNA_JANMASHTAMI: {
    phases: ['VIDEO_INTRO', 'HANDOVER'],
    timings: {
      VIDEO_INTRO: 16500,
      HANDOVER: 1000
    }
  },
  
  // ━━━ RAM_NAVAMI (🚀 18.0s Cinematic Ghat Dawn, Fireworks & Floating Diyas) ━━━
RAM_NAVAMI: {
  phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
  timings: {
    FLASH: 3000,     // 0.0s से 3.0s: सरयू घाट पर सूर्योदय, कोहरा और पक्षी
    SHOOTING: 6000,  // 3.0s से 9.0s: मंदिर की रिम लाइट, तैरते दीये, आतिशबाज़ी (3.8s-6.8s) और सीन डार्क होना
    HANDOVER: 9000   // 9.0s से 18.0s: "जय श्री राम" टेक्स्ट, ग्रीटिंग और फेड-आउट हैंडओवर
  }
},

  // ━━━ PONGAL (🚀 17.5s Epic 5-Scene Cultural Sequence Sync) ━━━
  PONGAL: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 2500,     // 2.5s: स्वर्णिम सूर्योदय, उड़ते पक्षी और गन्ने के खेत (0s - 2.5s)
      SHOOTING: 11000, // 11.0s: बैलगाड़ी यात्रा, रंगोली कोलम, उबलता पोंगल पॉट, केला पत्ता दावत, अलाव और पतंग (2.5s - 13.5s)
      HANDOVER: 4000   // 4.0s: 3D स्वर्णिम "பொங்கல் வாழ்த்துக்கள் / Happy Pongal 2027" टेक्स्ट और कोमल फ़ेड-आउट (13.5s - 17.5s)
    }
  },
  
  /// ━━━ EID_UL_FITR & EID_AL_ADHA (🚀 10.5s Hyper-Realistic Cinematic Sync) ━━━
  EID_UL_FITR: {
    phases: ['MOONRISE', 'MOSQUE_REVEAL', 'TEXT'],
    timings: {
      MOONRISE: 3000,      // 0.0s से 3.0s: स्क्रीन फेड-इन, तारे, 3D चांद का उदय और God Rays
      MOSQUE_REVEAL: 3000, // 3.0s से 6.0s: मस्जिद का अवतरण, उड़ते फानूस और सुनहरी धूल
      TEXT: 4500           // 6.0s से 10.5s: 3D गोल्डन टेक्स्ट और फेड-आउट हैंडओवर
    }
  },
  EID_AL_ADHA: {
    phases: ['MOONRISE', 'MOSQUE_REVEAL', 'TEXT'],
    timings: {
      MOONRISE: 3000,      // 0.0s से 3.0s
      MOSQUE_REVEAL: 3000, // 3.0s से 6.0s
      TEXT: 4500           // 6.0s से 10.5s
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

  INDEPENDENCE_DAY: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 5000,     // 5.0s: लाल किला प्रकटीकरण, आसमान में उड़ती पतंगें, कोहरा, पक्षी प्रस्थान (0s - 5.0s)
      SHOOTING: 9000,  // 9.0s: राष्ट्रीय ध्वजारोहण, सलामी, गेंदा वर्षा, रात ढलना, आतिशबाजी (5.0s - 14.0s)
      HANDOVER: 5000   // 5.0s: "Happy Independence Day" टेक्स्ट और कोमल फेड-आउट हैंडओवर (14.0s - 19.0s)
    }
  },
  
  // ━━━ LOHRI (🚀 16.5s Standalone 3D Bonfire Video & Gold Text Sync) ━━━
  LOHRI: {
    phases: ['VIDEO_INTRO', 'HANDOVER'],
    timings: {
      VIDEO_INTRO: 16500, // 👈 10.0s 3D Video + 5.5s Gold Text & Fire Embers
      HANDOVER: 1000      // 👈 1.0s Smooth Dashboard Handover
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

  // ━━━ VALENTINES_DAY (🚀 13.0s Cinematic Sequence Sync) ━━━
  VALENTINES_DAY: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 1500,     // 1.5s: दो अर्ध-दिलों का आसमान में आगमन
      SHOOTING: 9500,  // 10.5s: दिलों का मिलना, कोमल लव-वेव्स का फैलना, और "Happy Valentine's Day" टेक्स्ट रीवील
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

  
 // ━━━ PATRIOTIC DAYS (🚀 18.0s Epic National Pride Cinematic Timeline Sync) ━━━
  REPUBLIC_DAY: {
    phases: ['FLASH', 'SHOOTING', 'HANDOVER'],
    timings: {
      FLASH: 2500,     // 2.5s: अशोक चक्र घूर्णन, अमर जवान ज्योति मशाल (0s - 2.5s)
      SHOOTING: 12000, // 12.0s: जेट फ्लाईपास्ट, तिरंगा धुआं, चक्र किरणें, तिरंगा कंफेटी, गेट फेड-आउट (2.5s - 14.5s)
      HANDOVER: 3500   // 3.5s: "Happy Republic Day" टेक्स्ट, राष्ट्रगान धुन, जय हिन्द और कोमल फेड-आउट हैंडओवर (14.5s - 18.0s)
    }
  },

// ━━━ MAHASHIVRATRI (🚀 16.0s Extended Abhishekam Text Sync) ━━━
  MAHASHIVRATRI: {
  phases: ['SMOKE_TRISHUL', 'SHIVALINGA_REVEAL', 'ABHISHEKAM_BELPATRA', 'KAILASH_SNOW_TEXT'],
  timings: {
    SMOKE_TRISHUL: 3500,        // 0.0s - 3.5s: Sardi ki dhund & Trishul Right Side Entry
    SHIVALINGA_REVEAL: 3500,    // 3.5s - 7.0s: Smoke clears, Grand Saja Hua Shivalinga
    ABHISHEKAM_BELPATRA: 3500,  // 7.0s - 10.5s: Bel Patra Rain & Ganga Jal Abhishekam Stream
    KAILASH_SNOW_TEXT: 5500     // 🚀 5.5s Ice-Style Text Display Time
    }
  },  

DURGA_PUJA: {
    phases: ['DHUNUCHI_SMOKE', 'DIVINE_EYES', 'TRISHUL_IMPACT', 'SHLOKA_TEXT'],
    timings: {
      DHUNUCHI_SMOKE: 3000,    // 0.0s - 3.0s
      DIVINE_EYES: 3500,       // 3.0s - 6.5s
      TRISHUL_IMPACT: 3000,    // 6.5s - 9.5s
      SHLOKA_TEXT: 6500        // 🚀 Extended to 6.5s for comfortable Sanskrit Shloka reading!
    }
  },

  // ━━━ DEV DEEPAWALI (🚀 12.0s Sacred Varanasi Ghat Sequence) ━━━
DEV_DEEPAWALI: {
  phases: ['GHAT_DAWN', 'FLOATING_DIYAS', 'TEXT'],
  timings: {
    GHAT_DAWN: 3000,      // 0.0s - 3.0s: Varanasi Ghat mist & Ganga Jal
    FLOATING_DIYAS: 5500,  // 3.0s - 8.0s: Floating Temple Lamps & Fireflies
    TEXT: 5500             // 🚀 5.5s 3D Gold Devanagari Text Display Time
    }
  },

// ━━━ CHHATH PUJA (🚀 12.0s Solar Arghya Sync) ━━━
CHHATH_PUJA: {
  phases: ['SOLAR_ARGHYA', 'SOOP_REVEAL', 'TEXT'],
  timings: {
    SOLAR_ARGHYA: 3000,
    SOOP_REVEAL: 5500,
    TEXT: 5500
  }
},

// 🚀 ━━━ KARWA CHAUTH (ADDED: 16.5s Full Moon, Sieve & 3D Gold Text Sync) ━━━
  KARWA_CHAUTH: {
    phases: ['FULL_MOON', 'SIEVE_SIGHT', 'TEXT', 'HANDOVER'],
    timings: {
      FULL_MOON: 3000,      // 0.0s - 3.0s
      SIEVE_SIGHT: 7000,    // 3.0s - 10.0s Video Playback
      TEXT: 5500,           // 🚀 5.5s 3D Gold Text Greeting Display Time
      HANDOVER: 1000        // Dashboard Transfer
    }
  },

  // 🚀 ━━━ GURU NANAK JAYANTI (ADDED: 16.5s Prakash Parv & Gurbani Text Sync) ━━━
  GURU_NANAK_JAYANTI: {
    phases: ['SAROVAR_DAWN', 'GOLDEN_TEMPLE', 'TEXT', 'HANDOVER'],
    timings: {
      SAROVAR_DAWN: 3000,      // 0.0s - 3.0s
      GOLDEN_TEMPLE: 7000,     // 3.0s - 10.0s Video Playback
      TEXT: 5500,              // 🚀 5.5s 3D Gold Gurbani Text Display Time
      HANDOVER: 1000           // Dashboard Transfer
    }
  },

  // ━━━ DUSSEHRA (🚀 16.5s Ravan Dahan & Fire Arrow Sync) ━━━
DUSSEHRA: {
  phases: ['RAVAN_DAHAN', 'FIRE_ARROW', 'TEXT', 'HANDOVER'],
  timings: {
    RAVAN_DAHAN: 3000,
    FIRE_ARROW: 7000,
    TEXT: 5500,
    HANDOVER: 1000
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
