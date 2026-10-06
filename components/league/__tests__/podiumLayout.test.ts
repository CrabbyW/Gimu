import { podiumColumns } from '../podiumLayout';

it('tři hráči: pořadí zleva 2·1·3, výšky 6·9·4 teček', () => {
  expect(podiumColumns(3)).toEqual([
    { rank: 2, order: 0, dots: 6 },
    { rank: 1, order: 1, dots: 9 },
    { rank: 3, order: 2, dots: 4 },
  ]);
});
it('víc hráčů než tři: pořád jen tři sloupce', () => expect(podiumColumns(12)).toHaveLength(3));
it('dva hráči: jen 2·1', () => expect(podiumColumns(2).map((c) => c.rank)).toEqual([2, 1]));
it('jeden hráč: jen 1', () => expect(podiumColumns(1).map((c) => c.rank)).toEqual([1]));
it('nikdo: prázdné', () => expect(podiumColumns(0)).toEqual([]));
