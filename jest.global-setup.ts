// Běží v rodičovském procesu jestu ještě před spuštěním workerů, takže tohle
// je jediné místo, kde nastavení process.env.TZ skutečně ovlivní časovou zónu
// všech testů (workeři TZ dědí při forku). Nastavení TZ přímo v testovacím
// souboru nebo v setupFiles běží už uvnitř workera a na systémovou TZ nemá vliv.
export default function globalSetup(): void {
  process.env.TZ = 'Europe/Prague';
}
