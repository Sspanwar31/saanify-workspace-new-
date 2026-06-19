import SpiritualEngine from '@/components/festival/engines/SpiritualEngine';
import DivineEngine from '@/components/festival/engines/DivineEngine';
import CelebrationEngine from '@/components/festival/engines/CelebrationEngine';
import WinterEngine from '@/components/festival/engines/WinterEngine';
import PatrioticEngine from '@/components/festival/engines/PatrioticEngine';

import FireEngine from '@/components/festival/engines/FireEngine';
import SkyEngine from '@/components/festival/engines/SkyEngine';
import SunEngine from '@/components/festival/engines/SunEngine';
import MysticEngine from '@/components/festival/engines/MysticEngine';

import CorporateEngine from '@/components/festival/engines/CorporateEngine';
import EmergencyEngine from '@/components/festival/engines/EmergencyEngine';
import TechEngine from '@/components/festival/engines/TechEngine';
import IndustrialEngine from '@/components/festival/engines/IndustrialEngine';
import PromoEngine from '@/components/festival/engines/PromoEngine';
import EventEngine from '@/components/festival/engines/EventEngine';

export const AnimationRegistry = {

  SPIRITUAL_ENGINE: SpiritualEngine,

  DIVINE_ENGINE: DivineEngine,

  CELEBRATION_ENGINE: CelebrationEngine,

  WINTER_ENGINE: WinterEngine,

  PATRIOTIC_ENGINE: PatrioticEngine,

  FIRE_ENGINE: FireEngine,

  SKY_ENGINE: SkyEngine,

  SUN_ENGINE: SunEngine,

  MYSTIC_ENGINE: MysticEngine,

  CORPORATE_ENGINE: CorporateEngine,

  EMERGENCY_ENGINE: EmergencyEngine,

  TECH_ENGINE: TechEngine,

  INDUSTRIAL_ENGINE: IndustrialEngine,

  PROMO_ENGINE: PromoEngine,

  EVENT_ENGINE: EventEngine,

} as const;
