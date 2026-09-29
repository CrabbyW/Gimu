import type { Services } from './contracts';
import { LocalNotificationService } from './mock/LocalNotificationService';
import { MockCosmeticsService } from './mock/MockCosmeticsService';
import { MockLeagueService } from './mock/MockLeagueService';
import { MockLessonService } from './mock/MockLessonService';
import { MockSeasonService } from './mock/MockSeasonService';
import { MockUserService } from './mock/MockUserService';

// Fáze 2: tady se mock implementace vymění za HTTP klienty. UI se nemění.
export const services: Services = {
  user: new MockUserService(), lessons: new MockLessonService(), league: new MockLeagueService(),
  season: new MockSeasonService(), cosmetics: new MockCosmeticsService(), notifications: new LocalNotificationService(),
};
export type * from './contracts';
