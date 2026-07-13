// Hand-computed known-good pregnancies used across the test suite.
// Every value here was derived by hand (integer day offsets from LMP) and
// independently cross-checked; see the offsets in ../src/core/calc.ts.

import type { Anchor, Pregnancy } from '../src/core/calc';

export interface Fixture {
  name: string;
  anchor: Anchor;
  expected: Pregnancy;
}

// Fixture 1: retrieval 2024-02-20 (spans the 2024 leap day).
//   lmp = 2024-02-06, edd = 2024-11-12 (verified by hand across Feb 29).
export const retrievalLeap: Fixture = {
  name: 'retrieval 2024-02-20 (leap year)',
  anchor: { type: 'retrieval', date: '2024-02-20' },
  expected: {
    lmp: '2024-02-06',
    edd: '2024-11-12',
    retrieval: '2024-02-20',
    transferDay3: '2024-02-23',
    transferDay5: '2024-02-25',
    betaHcg: '2024-03-06', // estimated: transferDay5 + 10
    lastProgesterone: '2024-04-16', // lmp + 70
    trimester1End: '2024-05-13', // lmp + 97
    trimester2End: '2024-08-19', // lmp + 195
    anchorType: 'retrieval',
  },
};

// Fixture 2: retrieval exactly on the leap day 2024-02-29.
//   lmp = 2024-02-15, edd = 2024-11-21.
export const retrievalOnLeapDay: Fixture = {
  name: 'retrieval 2024-02-29 (leap day anchor)',
  anchor: { type: 'retrieval', date: '2024-02-29' },
  expected: {
    lmp: '2024-02-15',
    edd: '2024-11-21',
    retrieval: '2024-02-29',
    transferDay3: '2024-03-03',
    transferDay5: '2024-03-05',
    betaHcg: '2024-03-15', // transferDay5 + 10
    lastProgesterone: '2024-04-25', // lmp + 70
    trimester1End: '2024-05-22', // lmp + 97
    trimester2End: '2024-08-28', // lmp + 195
    anchorType: 'retrieval',
  },
};

// Fixture 3: LMP anchor spanning Feb 29 2024. lmp = 2024-02-10.
//   edd = 2024-11-16.
export const lmpAcrossLeap: Fixture = {
  name: 'lmp 2024-02-10 (spans Feb 29)',
  anchor: { type: 'lmp', date: '2024-02-10' },
  expected: {
    lmp: '2024-02-10',
    edd: '2024-11-16',
    retrieval: '2024-02-24',
    transferDay3: '2024-02-27',
    transferDay5: '2024-02-29', // day-5 transfer lands on the leap day
    betaHcg: '2024-03-10', // transferDay5 + 10
    lastProgesterone: '2024-04-20', // lmp + 70
    trimester1End: '2024-05-17', // lmp + 97
    trimester2End: '2024-08-23', // lmp + 195
    anchorType: 'lmp',
  },
};

// Fixture 4: 2025 pregnancy spanning no leap day. lmp = 2025-03-03.
export const noLeap2025: Fixture = {
  name: 'lmp 2025-03-03 (no leap day)',
  anchor: { type: 'lmp', date: '2025-03-03' },
  expected: {
    lmp: '2025-03-03',
    edd: '2025-12-08',
    retrieval: '2025-03-17',
    transferDay3: '2025-03-20',
    transferDay5: '2025-03-22',
    betaHcg: '2025-04-01', // transferDay5 + 10
    lastProgesterone: '2025-05-12', // lmp + 70
    trimester1End: '2025-06-08', // lmp + 97
    trimester2End: '2025-09-14', // lmp + 195
    anchorType: 'lmp',
  },
};

// Fixture 5: GA anchor. lmp 2024-01-01, GA 10w0d on 2024-03-11.
//   (2024-03-11 − 2024-01-01 = 70 days = 10w0d; conceptional 8w0d.)
export const gaFixture: Fixture = {
  name: 'ga_on_date 10w0d on 2024-03-11 (lmp 2024-01-01)',
  anchor: { type: 'ga_on_date', date: '2024-03-11', ga: { weeks: 10, days: 0 } },
  expected: {
    lmp: '2024-01-01',
    edd: '2024-10-07',
    retrieval: '2024-01-15',
    transferDay3: '2024-01-18',
    transferDay5: '2024-01-20',
    betaHcg: '2024-01-30', // transferDay5 + 10
    lastProgesterone: '2024-03-11', // lmp + 70
    trimester1End: '2024-04-07', // lmp + 97
    trimester2End: '2024-07-14', // lmp + 195
    anchorType: 'ga_on_date',
  },
};

export const allFixtures: Fixture[] = [
  retrievalLeap,
  retrievalOnLeapDay,
  lmpAcrossLeap,
  noLeap2025,
  gaFixture,
];
