// PURE module — no DOM, no clock, no external deps.
//
// Fruit/size comparisons follow the widely-used BabyCenter-style progression.
// Developmental notes are drawn from standard embryology references:
//   Moore KL et al., The Developing Human (11th ed.)
//   NHS Pregnancy Week by Week (https://www.nhs.uk/pregnancy/week-by-week/)
//
// Notes are factual and informational only — NOT medical advice.

export interface WeekGuide {
  week: number;
  comparison: string;
  note: string;
}

const GUIDES: WeekGuide[] = [
  {
    week: 4,
    comparison: 'about the size of a poppy seed',
    note: 'The embryo implants in the uterine wall and the amniotic sac begins to form.',
  },
  {
    week: 5,
    comparison: 'about the size of a sesame seed',
    note: 'The primitive heart tube begins to form and will soon start beating.',
  },
  {
    week: 6,
    comparison: 'about the size of a lentil',
    note: 'The neural tube closes and the heart begins to beat.',
  },
  {
    week: 7,
    comparison: 'about the size of a blueberry',
    note: 'The brain is growing rapidly and arm and leg buds are visible.',
  },
  {
    week: 8,
    comparison: 'about the size of a raspberry',
    note: 'All major organs have begun to develop and fingers are starting to form.',
  },
  {
    week: 9,
    comparison: 'about the size of a grape',
    note: 'Eyelids are forming and the embryo is now officially called a fetus.',
  },
  {
    week: 10,
    comparison: 'about the size of a kumquat',
    note: 'Bones are beginning to harden and the external ears are taking shape.',
  },
  {
    week: 11,
    comparison: 'about the size of a fig',
    note: 'The baby can open and close its fists and tooth buds are forming.',
  },
  {
    week: 12,
    comparison: 'about the size of a lime',
    note: 'Fingernails are forming and reflexes are developing.',
  },
  {
    week: 13,
    comparison: 'about the size of a lemon',
    note: 'The fingerprints are forming and the vocal cords are developing.',
  },
  {
    week: 14,
    comparison: 'about the size of a lemon',
    note: 'The baby can squint, frown, and grimace as facial muscles develop.',
  },
  {
    week: 15,
    comparison: 'about the size of an apple',
    note: 'Bones are getting stronger and the baby is practising breathing movements.',
  },
  {
    week: 16,
    comparison: 'about the size of an avocado',
    note: 'The baby\'s eyes can make small movements and taste buds are forming.',
  },
  {
    week: 17,
    comparison: 'about the size of a pear',
    note: 'Fat stores are beginning to develop beneath the baby\'s skin.',
  },
  {
    week: 18,
    comparison: 'about the size of a pomegranate',
    note: 'The baby\'s ears are now in their final position and hearing is developing.',
  },
  {
    week: 19,
    comparison: 'about the size of a mango',
    note: 'Vernix caseosa, a waxy coating, is forming to protect the baby\'s skin.',
  },
  {
    week: 20,
    comparison: 'about the size of a banana',
    note: 'You may start feeling movements — a sensation known as quickening.',
  },
  {
    week: 21,
    comparison: 'about the size of a carrot',
    note: 'The baby\'s eyebrows and eyelids are fully developed.',
  },
  {
    week: 22,
    comparison: 'about the size of a corn cob',
    note: 'The baby\'s grip is strengthening and sleep cycles are becoming established.',
  },
  {
    week: 23,
    comparison: 'about the size of a grapefruit',
    note: 'The baby is developing a sense of balance as the inner ear matures.',
  },
  {
    week: 24,
    comparison: 'about the size of a cantaloupe',
    note: 'Viability milestone — lungs are developing rapidly and producing surfactant.',
  },
  {
    week: 25,
    comparison: 'about the size of a cauliflower head',
    note: 'The baby\'s skin is becoming less transparent as fat deposits increase.',
  },
  {
    week: 26,
    comparison: 'about the size of a head of lettuce',
    note: 'Eyes begin to open for the first time and the baby can respond to sounds.',
  },
  {
    week: 27,
    comparison: 'about the size of a rutabaga',
    note: 'Brain activity increases significantly and the baby has regular sleep patterns.',
  },
  {
    week: 28,
    comparison: 'about the size of an eggplant',
    note: 'The baby can blink and the lungs are capable of breathing air.',
  },
  {
    week: 29,
    comparison: 'about the size of a butternut squash',
    note: 'The baby\'s muscles and lungs are continuing to mature rapidly.',
  },
  {
    week: 30,
    comparison: 'about the size of a large cabbage',
    note: 'The baby\'s bone marrow has taken over red blood cell production.',
  },
  {
    week: 31,
    comparison: 'about the size of a coconut',
    note: 'All five senses are functional and the brain is developing rapidly.',
  },
  {
    week: 32,
    comparison: 'about the size of a jicama',
    note: 'The baby is practising breathing movements using the amniotic fluid.',
  },
  {
    week: 33,
    comparison: 'about the size of a pineapple',
    note: 'The baby\'s skeleton is hardening, though the skull remains flexible for birth.',
  },
  {
    week: 34,
    comparison: 'about the size of a butternut squash',
    note: 'The central nervous system and lungs are continuing to mature.',
  },
  {
    week: 35,
    comparison: 'about the size of a honeydew melon',
    note: 'Most babies turn head-down in preparation for birth around this time.',
  },
  {
    week: 36,
    comparison: 'about the size of a head of romaine lettuce',
    note: 'The baby is considered late preterm and fat continues to accumulate.',
  },
  {
    week: 37,
    comparison: 'about the size of a bunch of Swiss chard',
    note: 'The baby is now considered full term and is ready for birth.',
  },
  {
    week: 38,
    comparison: 'about the size of a leek',
    note: 'Lanugo (fine hair) is mostly shed and the baby continues gaining weight.',
  },
  {
    week: 39,
    comparison: 'about the size of a small pumpkin',
    note: 'The brain and nervous system continue developing even at this late stage.',
  },
  {
    week: 40,
    comparison: 'about the size of a watermelon',
    note: 'The baby is fully developed and ready for life outside the womb.',
  },
];

// Build a fast lookup map at module load time.
const GUIDE_MAP = new Map<number, WeekGuide>(GUIDES.map((g) => [g.week, g]));

/** Returns the WeekGuide for the given gestational week (4–40), or null outside
 *  that range. */
export function weekGuideFor(week: number): WeekGuide | null {
  return GUIDE_MAP.get(week) ?? null;
}
