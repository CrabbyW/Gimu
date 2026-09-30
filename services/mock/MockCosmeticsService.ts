import type { CosmeticsService } from '../contracts';
import { notImplemented } from './notImplemented';

/** Plán A: kosmetika se nikde v UI nevolá. Plán B nahradí skutečnou implementací. */
export class MockCosmeticsService implements CosmeticsService {
  getCatalog = notImplemented('cosmetics.getCatalog');
  getWardrobe = notImplemented('cosmetics.getWardrobe');
  equip = notImplemented('cosmetics.equip');
  acquireFromShop = notImplemented('cosmetics.acquireFromShop');
}
