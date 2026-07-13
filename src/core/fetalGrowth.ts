// PURE module — no DOM, no localStorage, no clock. 'today' is always a parameter.
//
// Static fetal-growth reference, gestational weeks 8–40 (null outside that range).
// Weeks 8–13 are crown-rump length (CRL); weeks 14+ are crown-heel length.
//
// Source: perinatology.com fetal development reference
//   https://perinatology.com/Reference/Fetal%20development.htm  (fetched 2026-07)
//
// Length (cm) values are taken verbatim from that page for every week 8–40.
// Weight (g) values weeks 14–40 are taken verbatim from that page. The page lists
// NO weight for weeks 8 and 9, so those two use the standard published averages
// (8→1 g, 9→2 g).
//
// KNOWN DATA CAVEAT: the source page's weight column for weeks 10–13
// (35/45/58/73 g) is misaligned with its own crown-rump lengths — a 3.1 cm CRL
// fetus does not weigh 35 g. Weeks 10–13 therefore use the widely published
// CRL-consistent averages (4/7/14/23 g, matching standard fetal growth tables)
// instead of the page's figures. All values are approximations either way.

export interface FetalSize {
  week: number;
  lengthCm: number;
  weightG: number;
}

const TABLE: Record<number, { lengthCm: number; weightG: number }> = {
  8: { lengthCm: 1.6, weightG: 1 }, // weeks 8–9 weight: standard average (page has none)
  9: { lengthCm: 2.3, weightG: 2 },
  10: { lengthCm: 3.1, weightG: 4 }, // weeks 10–13 weight: CRL-consistent averages (see caveat above)
  11: { lengthCm: 4.1, weightG: 7 },
  12: { lengthCm: 5.4, weightG: 14 },
  13: { lengthCm: 6.7, weightG: 23 },
  14: { lengthCm: 14.7, weightG: 93 }, // crown-heel begins
  15: { lengthCm: 16.7, weightG: 117 },
  16: { lengthCm: 18.6, weightG: 146 },
  17: { lengthCm: 20.4, weightG: 181 },
  18: { lengthCm: 22.2, weightG: 223 },
  19: { lengthCm: 24.0, weightG: 273 },
  20: { lengthCm: 25.7, weightG: 331 },
  21: { lengthCm: 27.4, weightG: 399 },
  22: { lengthCm: 29.0, weightG: 478 },
  23: { lengthCm: 30.6, weightG: 568 },
  24: { lengthCm: 32.2, weightG: 670 },
  25: { lengthCm: 33.7, weightG: 785 },
  26: { lengthCm: 35.1, weightG: 913 },
  27: { lengthCm: 36.6, weightG: 1055 },
  28: { lengthCm: 37.9, weightG: 1210 },
  29: { lengthCm: 39.2, weightG: 1379 },
  30: { lengthCm: 40.5, weightG: 1559 },
  31: { lengthCm: 41.8, weightG: 1751 },
  32: { lengthCm: 43.0, weightG: 1953 },
  33: { lengthCm: 44.0, weightG: 2162 },
  34: { lengthCm: 45.2, weightG: 2377 },
  35: { lengthCm: 46.3, weightG: 2595 },
  36: { lengthCm: 47.3, weightG: 2813 },
  37: { lengthCm: 48.3, weightG: 3028 },
  38: { lengthCm: 49.2, weightG: 3236 },
  39: { lengthCm: 50.1, weightG: 3435 },
  40: { lengthCm: 51.0, weightG: 3619 },
};

export function fetalSizeForWeek(week: number): FetalSize | null {
  const row = TABLE[week];
  if (!row) return null;
  return { week, lengthCm: row.lengthCm, weightG: row.weightG };
}
