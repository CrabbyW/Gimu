// Vynutí Europe/Prague bez ohledu na to, jak je jest spuštěn (npm script, `npx jest <file>`, CI).
// TZ nastavená jen v package.json "test" scriptu se obchází přímým voláním `npx jest`.
process.env.TZ = 'Europe/Prague';

// Guard: 30. 9. 00:01 místního času (Europe/Prague, CEST = UTC+2) odpovídá 29. 9. 22:01 UTC.
// Pokud tenhle předpoklad neplatí, testy počítající s místním dnem (dates/streak/completion) by
// tiše prošly i na hostiteli v jiné časové zóně — proto tvrdý throw, ne jen skip.
if (new Date(2026, 8, 30, 0, 1).getUTCDate() !== 29) {
  throw new Error(
    'TZ guard selhal: proces neběží v Europe/Prague. Nastav TZ=Europe/Prague (cross-env v "test" scriptu, nebo systémově).',
  );
}
