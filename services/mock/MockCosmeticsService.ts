import type { CosmeticsService } from '../contracts';
import { notImplemented } from './notImplemented';

/** Plán A: kosmetika se nikde v UI nevolá. Plán B nahradí skutečnou implementací. */
export class MockCosmeticsService implements CosmeticsService {
  getCatalog = notImplemented('cosmetics.getCatalog');
  equip = notImplemented('cosmetics.equip');
  acquireFromShop = notImplemented('cosmetics.acquireFromShop');
}
