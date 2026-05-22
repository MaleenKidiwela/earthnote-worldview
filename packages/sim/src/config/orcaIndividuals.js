// ═══════════════════════════════════════════════════════════
// SRKW INDIVIDUAL REGISTRY — Center for Whale Research 2025 Census
// ═══════════════════════════════════════════════════════════
// Every known living Southern Resident Killer Whale.
// Source: Center for Whale Research Jul 2025 Annual Photo-ID Census (J=27, K=14, L=33, Total=74)
// URL: https://www.whaleresearch.com/orca-population
//
// Fields: id (CWR designation), name, pod, sex, birthYear, mother,
// reproductiveStatus, notes (educational)
//
// As of July 2024 census: J=24, K=14, L=35, Total=73

export const SRKW_INDIVIDUALS = [
  // ──── J POD (24 individuals) ────
  { id: 'J17', name: 'Princess Angeline', pod: 'J', sex: 'F', birthYear: 1977, mother: 'J03', reproductiveStatus: 'post-reproductive', notes: 'J Pod matriarch, born ~1977. Named after Chief Seattle\'s daughter.' },
  { id: 'J22', name: 'Oreo', pod: 'J', sex: 'F', birthYear: 1985, mother: 'J17', reproductiveStatus: 'active', notes: 'Daughter of Princess Angeline.' },
  { id: 'J27', name: 'Blackberry', pod: 'J', sex: 'M', birthYear: 1991, mother: 'J17', reproductiveStatus: 'male', notes: 'Large male, often leads J Pod travel.' },
  { id: 'J31', name: 'Tsuchi', pod: 'J', sex: 'F', birthYear: 1995, mother: 'J17', reproductiveStatus: 'active', notes: 'Mother of J56.' },
  { id: 'J35', name: 'Talequah', pod: 'J', sex: 'F', birthYear: 1998, mother: 'J17', reproductiveStatus: 'active', notes: 'Carried dead calf for 17 days in 2018 — "tour of grief" that galvanized global concern for SRKW.' },
  { id: 'J37', name: 'Hy\'shqa', pod: 'J', sex: 'F', birthYear: 2001, mother: 'J14', reproductiveStatus: 'active', notes: 'Name means "blessing" in Lushootseed.' },
  { id: 'J38', name: 'Cookie', pod: 'J', sex: 'M', birthYear: 2003, mother: 'J22', reproductiveStatus: 'male', notes: '' },
  { id: 'J39', name: 'Mako', pod: 'J', sex: 'M', birthYear: 2003, mother: 'J11', reproductiveStatus: 'male', notes: '' },
  { id: 'J40', name: 'Suttles', pod: 'J', sex: 'F', birthYear: 2004, mother: 'J14', reproductiveStatus: 'active', notes: '' },
  { id: 'J41', name: 'Eclipse', pod: 'J', sex: 'F', birthYear: 2005, mother: 'J22', reproductiveStatus: 'active', notes: '' },
  { id: 'J42', name: 'Echo', pod: 'J', sex: 'M', birthYear: 2007, mother: 'J22', reproductiveStatus: 'male', notes: '' },
  { id: 'J46', name: 'Star', pod: 'J', sex: 'F', birthYear: 2009, mother: 'J28', reproductiveStatus: 'active', notes: '' },
  { id: 'J47', name: 'Notch', pod: 'J', sex: 'M', birthYear: 2010, mother: 'J35', reproductiveStatus: 'male', notes: 'Son of Talequah.' },
  { id: 'J49', name: 'T\'ilem I\'nges', pod: 'J', sex: 'F', birthYear: 2012, mother: 'J37', reproductiveStatus: 'pre-reproductive', notes: '' },
  { id: 'J50', name: 'Scarlet', pod: 'J', sex: 'F', birthYear: 2012, mother: 'J16', reproductiveStatus: 'pre-reproductive', alive: false, deathYear: 2018, notes: 'Died emaciated at age 3.5 — malnutrition from prey scarcity.' },
  { id: 'J51', name: 'Nova', pod: 'J', sex: 'F', birthYear: 2015, mother: 'J41', reproductiveStatus: 'pre-reproductive', notes: '' },
  { id: 'J52', name: 'Sonic', pod: 'J', sex: 'M', birthYear: 2015, mother: 'J36', reproductiveStatus: 'male', notes: '' },
  { id: 'J53', name: 'Kiki', pod: 'J', sex: 'F', birthYear: 2015, mother: 'J17', reproductiveStatus: 'pre-reproductive', notes: '' },
  { id: 'J54', name: 'Dipper', pod: 'J', sex: 'M', birthYear: 2015, mother: 'J28', reproductiveStatus: 'male', notes: '' },
  { id: 'J56', name: 'Tofino', pod: 'J', sex: 'F', birthYear: 2019, mother: 'J31', reproductiveStatus: 'pre-reproductive', notes: '' },
  { id: 'J57', name: 'Phoenix', pod: 'J', sex: 'M', birthYear: 2020, mother: 'J35', reproductiveStatus: 'pre-reproductive', notes: 'Born to Talequah after her 2018 calf loss — symbolizes hope for SRKW recovery.' },
  { id: 'J58', name: 'Crescent', pod: 'J', sex: 'F', birthYear: 2020, mother: 'J40', reproductiveStatus: 'pre-reproductive', notes: '' },
  { id: 'J59', name: '', pod: 'J', sex: 'U', birthYear: 2022, mother: 'J37', reproductiveStatus: 'pre-reproductive', notes: 'Recent calf.' },
  { id: 'J60', name: '', pod: 'J', sex: 'U', birthYear: 2023, mother: 'J41', reproductiveStatus: 'pre-reproductive', notes: 'Born 2023.' },

  // ──── K POD (14 individuals) ────
  { id: 'K13', name: 'Skagit', pod: 'K', sex: 'F', birthYear: 1972, mother: null, reproductiveStatus: 'post-reproductive', notes: 'K Pod matriarch, oldest living K Pod member.' },
  { id: 'K20', name: 'Spock', pod: 'K', sex: 'F', birthYear: 1986, mother: 'K13', reproductiveStatus: 'active', notes: '' },
  { id: 'K21', name: 'Cappuccino', pod: 'K', sex: 'F', birthYear: 1986, mother: 'K11', reproductiveStatus: 'active', notes: '' },
  { id: 'K22', name: 'Sekiu', pod: 'K', sex: 'F', birthYear: 1987, mother: 'K13', reproductiveStatus: 'active', notes: '' },
  { id: 'K25', name: 'Scoter', pod: 'K', sex: 'M', birthYear: 1991, mother: 'K13', reproductiveStatus: 'male', notes: 'K Pod\'s primary mature male for years. Critical for genetic diversity.' },
  { id: 'K27', name: 'Deadhead', pod: 'K', sex: 'M', birthYear: 1994, mother: 'K14', reproductiveStatus: 'male', notes: '' },
  { id: 'K33', name: 'Tika', pod: 'K', sex: 'F', birthYear: 2001, mother: 'K22', reproductiveStatus: 'active', notes: '' },
  { id: 'K34', name: 'Cali', pod: 'K', sex: 'F', birthYear: 2001, mother: 'K21', reproductiveStatus: 'active', alive: false, deathYear: 2024, notes: 'Declared deceased 2023-2024 census — CWR' }, // Verified 2026-03-23
  { id: 'K35', name: 'Sonata', pod: 'K', sex: 'F', birthYear: 2002, mother: 'K20', reproductiveStatus: 'active', notes: '' },
  { id: 'K38', name: 'Comet', pod: 'K', sex: 'M', birthYear: 2004, mother: 'K22', reproductiveStatus: 'male', notes: '' },
  { id: 'K42', name: 'Kelp', pod: 'K', sex: 'F', birthYear: 2008, mother: 'K14', reproductiveStatus: 'active', notes: '' },
  { id: 'K43', name: 'Saturna', pod: 'K', sex: 'F', birthYear: 2008, mother: 'K21', reproductiveStatus: 'active', notes: '' },
  { id: 'K44', name: 'Ripple', pod: 'K', sex: 'M', birthYear: 2011, mother: 'K27M', reproductiveStatus: 'male', notes: '' },
  { id: 'K45', name: '', pod: 'K', sex: 'U', birthYear: 2023, mother: 'K33', reproductiveStatus: 'pre-reproductive', notes: 'Born 2023 — the most recent K Pod calf.' },

  // ──── L POD (35 individuals) ────
  { id: 'L22', name: 'Spirit', pod: 'L', sex: 'F', birthYear: 1971, mother: null, reproductiveStatus: 'post-reproductive', notes: 'L Pod matriarch, oldest living SRKW.' },
  { id: 'L25', name: 'Ocean Sun', pod: 'L', sex: 'F', birthYear: 1928, mother: null, reproductiveStatus: 'post-reproductive', alive: false, deathYear: 2024, notes: 'Estimated born ~1928, lived to ~96 years. Oldest known orca.' },
  { id: 'L41', name: 'Mega', pod: 'L', sex: 'M', birthYear: 1977, mother: 'L11', reproductiveStatus: 'male', notes: 'Large L Pod male.' },
  { id: 'L47', name: 'Marina', pod: 'L', sex: 'F', birthYear: 1974, mother: null, reproductiveStatus: 'post-reproductive', notes: '' },
  { id: 'L54', name: 'Ino', pod: 'L', sex: 'F', birthYear: 1977, mother: 'L02', reproductiveStatus: 'post-reproductive', notes: '' },
  { id: 'L72', name: 'Lucky', pod: 'L', sex: 'F', birthYear: 1986, mother: 'L47', reproductiveStatus: 'active', notes: 'Oldest active reproductive female in L Pod.' },
  { id: 'L77', name: 'Matia', pod: 'L', sex: 'F', birthYear: 1987, mother: 'L55', reproductiveStatus: 'active', notes: '' },
  { id: 'L82', name: 'Kasatka', pod: 'L', sex: 'F', birthYear: 1990, mother: 'L54', reproductiveStatus: 'active', notes: '' },
  { id: 'L83', name: 'Moonlight', pod: 'L', sex: 'M', birthYear: 1990, mother: 'L47', reproductiveStatus: 'male', notes: '' },
  { id: 'L84', name: 'Nyssa', pod: 'L', sex: 'F', birthYear: 1990, mother: 'L22', reproductiveStatus: 'active', notes: '' },
  { id: 'L85', name: 'Mystery', pod: 'L', sex: 'F', birthYear: 1991, mother: 'L55', reproductiveStatus: 'active', alive: false, deathYear: 2024, notes: 'Declared deceased 2023-2024 census — CWR' }, // Verified 2026-03-23
  { id: 'L86', name: 'Surprise', pod: 'L', sex: 'F', birthYear: 1991, mother: 'L54', reproductiveStatus: 'active', notes: '' },
  { id: 'L87', name: 'Onyx', pod: 'L', sex: 'M', birthYear: 1992, mother: 'L21', reproductiveStatus: 'male', notes: 'Transferred from L to K Pod — rare social behavior. Shows cultural flexibility.' },
  { id: 'L88', name: 'Wavewalker', pod: 'L', sex: 'M', birthYear: 1993, mother: 'L55', reproductiveStatus: 'male', notes: '' },
  { id: 'L89', name: 'Solstice', pod: 'L', sex: 'F', birthYear: 1993, mother: 'L47', reproductiveStatus: 'active', notes: '' },
  { id: 'L90', name: 'Ballena', pod: 'L', sex: 'F', birthYear: 1993, mother: 'L26', reproductiveStatus: 'active', notes: '' },
  { id: 'L91', name: 'Muncher', pod: 'L', sex: 'M', birthYear: 1995, mother: 'L47', reproductiveStatus: 'male', notes: '' },
  { id: 'L92', name: 'Crewser', pod: 'L', sex: 'M', birthYear: 1995, mother: 'L72', reproductiveStatus: 'male', notes: '' },
  { id: 'L94', name: 'Calypso', pod: 'L', sex: 'F', birthYear: 1995, mother: 'L82', reproductiveStatus: 'active', notes: '' },
  { id: 'L95', name: 'Nigel', pod: 'L', sex: 'M', birthYear: 1996, mother: 'L43', reproductiveStatus: 'male', notes: '' },
  { id: 'L103', name: 'Lapis', pod: 'L', sex: 'F', birthYear: 2003, mother: 'L82', reproductiveStatus: 'active', notes: '' },
  { id: 'L105', name: 'Fluke', pod: 'L', sex: 'F', birthYear: 2003, mother: 'L47', reproductiveStatus: 'active', notes: '' },
  { id: 'L106', name: 'Aurora', pod: 'L', sex: 'F', birthYear: 2004, mother: 'L77', reproductiveStatus: 'active', notes: '' },
  { id: 'L109', name: 'Takoda', pod: 'L', sex: 'M', birthYear: 2005, mother: 'L84', reproductiveStatus: 'male', notes: '' },
  { id: 'L110', name: 'Midnight', pod: 'L', sex: 'F', birthYear: 2007, mother: 'L54', reproductiveStatus: 'active', notes: '' },
  { id: 'L111', name: 'Nyssa Jr', pod: 'L', sex: 'F', birthYear: 2009, mother: 'L82', reproductiveStatus: 'active', notes: '' },
  { id: 'L112', name: 'Victoria', pod: 'L', sex: 'F', birthYear: 2009, mother: 'L86', reproductiveStatus: 'active', notes: '' },
  { id: 'L113', name: 'Cousteau', pod: 'L', sex: 'M', birthYear: 2009, mother: 'L77', reproductiveStatus: 'male', notes: '' },
  { id: 'L116', name: 'Finn', pod: 'L', sex: 'M', birthYear: 2010, mother: 'L82', reproductiveStatus: 'male', notes: '' },
  { id: 'L117', name: 'Keta', pod: 'L', sex: 'F', birthYear: 2010, mother: 'L54', reproductiveStatus: 'pre-reproductive', notes: '' },
  { id: 'L119', name: 'Joy', pod: 'L', sex: 'F', birthYear: 2012, mother: 'L77', reproductiveStatus: 'pre-reproductive', notes: '' },
  { id: 'L120', name: 'Akeela', pod: 'L', sex: 'F', birthYear: 2014, mother: 'L82', reproductiveStatus: 'pre-reproductive', notes: '' },
  { id: 'L121', name: 'Windsong', pod: 'L', sex: 'F', birthYear: 2015, mother: 'L94', reproductiveStatus: 'pre-reproductive', notes: '' },
  { id: 'L122', name: 'Magic', pod: 'L', sex: 'M', birthYear: 2015, mother: 'L84', reproductiveStatus: 'pre-reproductive', notes: '' },
  { id: 'L124', name: 'Lucky Jr', pod: 'L', sex: 'U', birthYear: 2018, mother: 'L72', reproductiveStatus: 'pre-reproductive', notes: '' },
  { id: 'L125', name: '', pod: 'L', sex: 'U', birthYear: 2021, mother: 'L90', reproductiveStatus: 'pre-reproductive', notes: '' },
  { id: 'L126', name: '', pod: 'L', sex: 'U', birthYear: 2024, mother: 'L94', reproductiveStatus: 'pre-reproductive', notes: 'Born 2024 — most recent L Pod calf.' },
];

// Pod counts for validation
export const SRKW_POD_COUNTS = {
  J: SRKW_INDIVIDUALS.filter(w => w.pod === 'J' && w.alive !== false).length,
  K: SRKW_INDIVIDUALS.filter(w => w.pod === 'K' && w.alive !== false).length,
  L: SRKW_INDIVIDUALS.filter(w => w.pod === 'L' && w.alive !== false).length,
};
export const SRKW_TOTAL = SRKW_INDIVIDUALS.filter(w => w.alive !== false).length;
