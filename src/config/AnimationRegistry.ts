'use client';

// 🚀 1. नए कोर इंजनों का इम्पोर्ट
import ParticleEngine from '@/components/festival/engines/ParticleEngine';
import RayEngine from '@/components/festival/engines/RayEngine';
import WaveEngine from '@/components/festival/engines/WaveEngine';
import NeonEngine from '@/components/festival/engines/NeonEngine';
import SmokeEngine from '@/components/festival/engines/SmokeEngine';
import MorphEngine from '@/components/festival/engines/MorphEngine';

// 🌸 2. सुरक्षित रखे गए प्रीमियम इंजन (Holi, Diwali, Chhath)
import HoliColorBlast from '@/components/festival/engines/effects/HoliColorBlast';
import SpiritualEngine from '@/components/festival/engines/SpiritualEngine';
import SunEngine from '@/components/festival/engines/SunEngine';

export const AnimationRegistry = {
  // ── कोर इंजन रजिस्ट्री ──
  PARTICLE_ENGINE: ParticleEngine,
  RAY_ENGINE: RayEngine,
  WAVE_ENGINE: WaveEngine,
  NEON_ENGINE: NeonEngine,
  SMOKE_ENGINE: SmokeEngine,
  MORPH_ENGINE: MorphEngine,

  // ── सुरक्षित प्रीमियम पुराने इंजन ──
  HOLI_COLOR_BLAST: HoliColorBlast,
  SPIRITUAL_ENGINE: SpiritualEngine,
  SUN_ENGINE: SunEngine,

  // 🛡️ सेफ एलियास (TypeScript और रनटाइम क्रैश रोकने के लिए पुराने नामों का नए इंजनों पर रीडायरेक्शन)
  CELEBRATION_ENGINE: ParticleEngine,
  WINTER_ENGINE: ParticleEngine,
  SKY_ENGINE: ParticleEngine,
  PROMO_ENGINE: ParticleEngine,
  FIRE_ENGINE: ParticleEngine,
  
  DIVINE_ENGINE: RayEngine,
  MYSTIC_ENGINE: RayEngine,
  PATRIOTIC_ENGINE: RayEngine,
  CORPORATE_ENGINE: RayEngine,
  EMERGENCY_ENGINE: RayEngine,
  
  TECH_ENGINE: NeonEngine,
  INDUSTRIAL_ENGINE: NeonEngine,
  EVENT_ENGINE: NeonEngine,
} as const;
