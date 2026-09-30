import type { LeagueService } from '../contracts';
import { notImplemented } from './notImplemented';

/** Plán A: liga se nikde v UI nevolá. Plán B nahradí skutečnou implementací. */
export class MockLeagueService implements LeagueService {
  getCurrentWeek = notImplemented('league.getCurrentWeek');
  dismissLastResult = notImplemented('league.dismissLastResult');
}
