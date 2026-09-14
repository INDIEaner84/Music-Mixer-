import { DeckId, HarmonicDelta, Track } from '../types';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const CAMELOT_MAP: Record<string, string> = {
  'Ab Minor': '1A', 'G# Minor': '1A', 'B Major': '1B',
  'Eb Minor': '2A', 'D# Minor': '2A', 'F# Major': '2B', 'Gb Major': '2B',
  'Bb Minor': '3A', 'A# Minor': '3A', 'Db Major': '3B', 'C# Major': '3B',
  'F Minor': '4A', 'Ab Major': '4B', 'G# Major': '4B',
  'C Minor': '5A', 'Eb Major': '5B', 'D# Major': '5B',
  'G Minor': '6A', 'Bb Major': '6B', 'A# Major': '6B',
  'D Minor': '7A', 'F Major': '7B',
  'A Minor': '8A', 'C Major': '8B',
  'E Minor': '9A', 'G Major': '9B',
  'B Minor': '10A', 'D Major': '10B',
  'F# Minor': '11A', 'Gb Minor': '11A', 'A Major': '11B',
  'C# Minor': '12A', 'Db Minor': '12A', 'E Major': '12B',
  // Short format mappings
  'Abm': '1A', 'G#m': '1A', 'B': '1B',
  'Ebm': '2A', 'D#m': '2A', 'F#': '2B', 'Gb': '2B',
  'Bbm': '3A', 'A#m': '3A', 'Db': '3B', 'C#': '3B',
  'Fm': '4A', 'Ab': '4B', 'G#': '4B',
  'Cm': '5A', 'Eb': '5B', 'D#': '5B',
  'Gm': '6A', 'Bb': '6B', 'A#': '6B',
  'Dm': '7A', 'F': '7B',
  'Am': '8A', 'C': '8B',
  'Em': '9A', 'G': '9B',
  'Bm': '10A', 'D': '10B',
  'F#m': '11A', 'Gbm': '11A', 'A': '11B',
  'C#m': '12A', 'Dbm': '12A', 'E': '12B',
};

// Reverse map: Camelot code -> Standard key name
export const CAMELOT_TO_KEY: Record<string, { key: string; name: string; isMinor: boolean }> = {
  '1A': { key: 'Ab Minor', name: 'G#m / Abm', isMinor: true },
  '1B': { key: 'B Major', name: 'B Maj', isMinor: false },
  '2A': { key: 'Eb Minor', name: 'D#m / Ebm', isMinor: true },
  '2B': { key: 'F# Major', name: 'F# Maj', isMinor: false },
  '3A': { key: 'Bb Minor', name: 'A#m / Bbm', isMinor: true },
  '3B': { key: 'Db Major', name: 'Db Maj', isMinor: false },
  '4A': { key: 'F Minor', name: 'Fm', isMinor: true },
  '4B': { key: 'Ab Major', name: 'Ab Maj', isMinor: false },
  '5A': { key: 'C Minor', name: 'Cm', isMinor: true },
  '5B': { key: 'Eb Major', name: 'Eb Maj', isMinor: false },
  '6A': { key: 'G Minor', name: 'Gm', isMinor: true },
  '6B': { key: 'Bb Major', name: 'Bb Maj', isMinor: false },
  '7A': { key: 'D Minor', name: 'Dm', isMinor: true },
  '7B': { key: 'F Major', name: 'F Maj', isMinor: false },
  '8A': { key: 'A Minor', name: 'Am', isMinor: true },
  '8B': { key: 'C Major', name: 'C Maj', isMinor: false },
  '9A': { key: 'E Minor', name: 'Em', isMinor: true },
  '9B': { key: 'G Major', name: 'G Maj', isMinor: false },
  '10A': { key: 'B Minor', name: 'Bm', isMinor: true },
  '10B': { key: 'D Major', name: 'D Maj', isMinor: false },
  '11A': { key: 'F# Minor', name: 'F#m', isMinor: true },
  '11B': { key: 'A Major', name: 'A Maj', isMinor: false },
  '12A': { key: 'C# Minor', name: 'C#m', isMinor: true },
  '12B': { key: 'E Major', name: 'E Maj', isMinor: false },
};

export interface ParsedKey {
  root: string;
  isMinor: boolean;
  rootIndex: number;
  original: string;
}

/**
 * Parses any key string (e.g. "A Minor", "Am", "8A", "F# Maj", "C") into a normalized structure
 */
export function parseKey(keyStr: string): ParsedKey {
  if (!keyStr) {
    return { root: 'A', isMinor: true, rootIndex: 9, original: 'A Minor' };
  }

  const clean = keyStr.trim();

  // Check if it's already a camelot code (e.g., "8A", "11B")
  if (/^([1-9]|1[0-2])[AB]$/i.test(clean)) {
    const camelotInfo = CAMELOT_TO_KEY[clean.toUpperCase()];
    if (camelotInfo) {
      return parseKey(camelotInfo.key);
    }
  }

  const isMinor = /minor|min|\bm\b|m$/i.test(clean) && !/maj/i.test(clean);

  // Extract root note
  let root = clean
    .replace(/minor|major|min|maj|m/gi, '')
    .trim();

  // Normalize enharmonics (e.g., Db -> C#, Eb -> D#, Gb -> F#, Ab -> G#, Bb -> A#)
  const enharmonicMap: Record<string, string> = {
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#',
  };
  if (enharmonicMap[root]) {
    root = enharmonicMap[root];
  }

  let rootIndex = NOTE_NAMES.indexOf(root);
  if (rootIndex === -1) {
    // Try matching first 1 or 2 chars
    if (root.length >= 2 && NOTE_NAMES.indexOf(root.slice(0, 2)) !== -1) {
      root = root.slice(0, 2);
      rootIndex = NOTE_NAMES.indexOf(root);
    } else if (NOTE_NAMES.indexOf(root.slice(0, 1)) !== -1) {
      root = root.slice(0, 1);
      rootIndex = NOTE_NAMES.indexOf(root);
    } else {
      root = 'A';
      rootIndex = 9;
    }
  }

  return {
    root,
    isMinor,
    rootIndex,
    original: keyStr,
  };
}

/**
 * Returns the Camelot Code for any given key string
 */
export function getCamelotCode(keyStr: string): string {
  if (!keyStr) return '8A';
  const clean = keyStr.trim().toUpperCase();
  if (/^([1-9]|1[0-2])[AB]$/.test(clean)) return clean;

  const direct = CAMELOT_MAP[keyStr.trim()];
  if (direct) return direct;

  const parsed = parseKey(keyStr);
  const fullName = `${parsed.root} ${parsed.isMinor ? 'Minor' : 'Major'}`;
  return CAMELOT_MAP[fullName] || '8A';
}

/**
 * Calculates the resulting key and Camelot code when shifting pitch by N semitones
 */
export function getShiftedKey(
  originalKey: string,
  semitones: number
): { key: string; camelot: string; root: string; isMinor: boolean } {
  const parsed = parseKey(originalKey);
  const newRootIndex = ((parsed.rootIndex + semitones) % 12 + 12) % 12;
  const newRoot = NOTE_NAMES[newRootIndex];
  const newKey = `${newRoot} ${parsed.isMinor ? 'Minor' : 'Major'}`;

  // Camelot calculation
  const origCamelot = getCamelotCode(originalKey);
  let origNum = parseInt(origCamelot, 10);
  const origLetter = origCamelot.replace(/[0-9]/g, '') || (parsed.isMinor ? 'A' : 'B');
  if (isNaN(origNum)) origNum = 8;

  // Semitone shift moves around circle of fifths (each +1 semitone = +7 hours on circle of fifths)
  const fifthShift = (semitones * 7) % 12;
  let newNum = (origNum + fifthShift + 120) % 12;
  if (newNum === 0) newNum = 12;

  return {
    key: newKey,
    camelot: `${newNum}${origLetter}`,
    root: newRoot,
    isMinor: parsed.isMinor,
  };
}

export interface HarmonicMatchResult {
  semitones: number;
  matchedKey: string;
  matchedCamelot: string;
  compatibilityScore: number;
  relationship: 'perfect' | 'relative' | 'subdominant' | 'dominant' | 'energy_boost' | 'diagonal';
  description: string;
  badgeColor: string;
}

/**
 * Finds the optimal semitone pitch-shift (range -6 to +6) to match a target master key
 */
export function calculateHarmonicKeyMatch(
  sourceKey: string,
  targetMasterKey: string
): HarmonicMatchResult {
  const src = parseKey(sourceKey);
  const target = parseKey(targetMasterKey);

  const targetCamelot = getCamelotCode(targetMasterKey);
  const targetNum = parseInt(targetCamelot, 10) || 8;
  const targetLetter = targetCamelot.replace(/[0-9]/g, '') || (target.isMinor ? 'A' : 'B');

  // Test all semitone shifts between -6 and +6 and rank by harmonic compatibility
  const candidateShifts = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, -6];

  let bestShift = 0;
  let bestScore = -1;
  let bestRel: HarmonicMatchResult['relationship'] = 'perfect';
  let bestDesc = 'Harmonische Abstimmung';
  let bestBadge = '#10b981';

  for (const shift of candidateShifts) {
    const shifted = getShiftedKey(sourceKey, shift);
    const shiftedNum = parseInt(shifted.camelot, 10) || 8;
    const shiftedLetter = shifted.camelot.replace(/[0-9]/g, '');

    let score = 0;
    let rel: HarmonicMatchResult['relationship'] = 'diagonal';
    let desc = '';
    let badge = '#64748b';

    // 1. Exact match (same number and letter)
    if (shiftedNum === targetNum && shiftedLetter === targetLetter) {
      score = 100 - Math.abs(shift) * 3; // Small penalty for larger pitch shift
      rel = 'perfect';
      desc = `Perfekt Identisch (${shifted.camelot} ➔ ${targetCamelot})`;
      badge = '#10b981';
    }
    // 2. Relative Major/Minor (same number, opposite letter)
    else if (shiftedNum === targetNum && shiftedLetter !== targetLetter) {
      score = 92 - Math.abs(shift) * 3;
      rel = 'relative';
      desc = `Parallele Tonart (${shifted.camelot} ➔ ${targetCamelot})`;
      badge = '#06b6d4';
    }
    // 3. Adjacent Camelot Number (+1 or -1 on circle of fifths)
    else if (
      (shiftedNum === (targetNum % 12) + 1 || (shiftedNum === 1 && targetNum === 12)) &&
      shiftedLetter === targetLetter
    ) {
      score = 88 - Math.abs(shift) * 3;
      rel = 'dominant';
      desc = `Dominante (+1 Camelot: ${shifted.camelot} ➔ ${targetCamelot})`;
      badge = '#3b82f6';
    } else if (
      (targetNum === (shiftedNum % 12) + 1 || (targetNum === 1 && shiftedNum === 12)) &&
      shiftedLetter === targetLetter
    ) {
      score = 88 - Math.abs(shift) * 3;
      rel = 'subdominant';
      desc = `Subdominante (-1 Camelot: ${shifted.camelot} ➔ ${targetCamelot})`;
      badge = '#8b5cf6';
    }
    // 4. Energy Boost (+2 semitones or +1 semitone)
    else if (shift === 2 || shift === 1) {
      score = 80 - Math.abs(shift) * 2;
      rel = 'energy_boost';
      desc = `Energy Jump (${shift > 0 ? '+' : ''}${shift} Halbtöne)`;
      badge = '#f59e0b';
    } else {
      // General distance on Camelot wheel
      const numDist = Math.min(
        Math.abs(shiftedNum - targetNum),
        12 - Math.abs(shiftedNum - targetNum)
      );
      score = Math.max(20, 75 - numDist * 12 - Math.abs(shift) * 4);
      desc = `Abstimmung (${shifted.camelot} auf ${targetCamelot})`;
      badge = '#a855f7';
    }

    if (score > bestScore) {
      bestScore = score;
      bestShift = shift;
      bestRel = rel;
      bestDesc = desc;
      bestBadge = badge;
    }
  }

  const finalShifted = getShiftedKey(sourceKey, bestShift);

  return {
    semitones: bestShift,
    matchedKey: finalShifted.key,
    matchedCamelot: finalShifted.camelot,
    compatibilityScore: Math.round(bestScore),
    relationship: bestRel,
    description: bestDesc,
    badgeColor: bestBadge,
  };
}

/**
 * Calculates current real-time harmonic compatibility between Deck A and Deck B
 */
export function getHarmonicCompatibility(
  keyA: string,
  keyB: string,
  semitonesA: number = 0,
  semitonesB: number = 0
): {
  score: number;
  camelotA: string;
  camelotB: string;
  keyA: string;
  keyB: string;
  description: string;
  isCompatible: boolean;
  color: string;
} {
  const shiftedA = getShiftedKey(keyA, semitonesA);
  const shiftedB = getShiftedKey(keyB, semitonesB);

  const numA = parseInt(shiftedA.camelot, 10) || 8;
  const numB = parseInt(shiftedB.camelot, 10) || 8;
  const letA = shiftedA.camelot.replace(/[0-9]/g, '');
  const letB = shiftedB.camelot.replace(/[0-9]/g, '');

  let score = 50;
  let desc = 'Modale Reibung';
  let isCompat = false;
  let color = '#ef4444';

  if (numA === numB && letA === letB) {
    score = 100;
    desc = '100% Harmonischer Gleichklang (Identische Tonart)';
    isCompat = true;
    color = '#10b981';
  } else if (numA === numB && letA !== letB) {
    score = 94;
    desc = 'Parallele Dur/Moll Harmonie (94% Match)';
    isCompat = true;
    color = '#06b6d4';
  } else if (
    (numB === (numA % 12) + 1 || (numB === 1 && numA === 12)) &&
    letA === letB
  ) {
    score = 90;
    desc = 'Dominante Übergangsharmonie (+1 Camelot)';
    isCompat = true;
    color = '#3b82f6';
  } else if (
    (numA === (numB % 12) + 1 || (numA === 1 && numB === 12)) &&
    letA === letB
  ) {
    score = 90;
    desc = 'Subdominante Übergangsharmonie (-1 Camelot)';
    isCompat = true;
    color = '#8b5cf6';
  } else {
    const numDist = Math.min(Math.abs(numA - numB), 12 - Math.abs(numA - numB));
    score = Math.max(25, 80 - numDist * 14);
    if (score >= 70) {
      desc = `Gute tonale Verträglichkeit (${score}%)`;
      isCompat = true;
      color = '#f59e0b';
    } else {
      desc = `Dissonanz-Warnung (${score}% Kompatibilität)`;
      isCompat = false;
      color = '#ef4444';
    }
  }

  return {
    score,
    camelotA: shiftedA.camelot,
    camelotB: shiftedB.camelot,
    keyA: shiftedA.key,
    keyB: shiftedB.key,
    description: desc,
    isCompatible: isCompat,
    color,
  };
}

/**
 * Computes complete metadata and harmonic delta values between two tracks in a transition event
 */
export function calculateTransitionHarmonicDelta(
  fromTrack: { key?: string; bpm?: number; intelligence?: { energy?: number }; pitchSemitones?: number; effectiveBpm?: number },
  toTrack: { key?: string; bpm?: number; intelligence?: { energy?: number }; pitchSemitones?: number; effectiveBpm?: number }
): HarmonicDelta {
  const fromKeyStr = fromTrack.key || 'A min';
  const toKeyStr = toTrack.key || 'A min';
  const semitonesFrom = fromTrack.pitchSemitones || 0;
  const semitonesTo = toTrack.pitchSemitones || 0;

  const shiftedFrom = getShiftedKey(fromKeyStr, semitonesFrom);
  const shiftedTo = getShiftedKey(toKeyStr, semitonesTo);

  const numFrom = parseInt(shiftedFrom.camelot, 10) || 8;
  const numTo = parseInt(shiftedTo.camelot, 10) || 8;
  const letFrom = shiftedFrom.camelot.replace(/[0-9]/g, '') || 'A';
  const letTo = shiftedTo.camelot.replace(/[0-9]/g, '') || 'A';

  const semitoneDelta = semitonesTo - semitonesFrom;
  
  // Calculate raw circle of fifths distance
  let fifthDistance = (numTo - numFrom + 12) % 12;
  if (fifthDistance > 6) fifthDistance -= 12; // e.g. -1 instead of +11

  let relationshipType: HarmonicDelta['relationshipType'] = 'diagonal';
  let relationshipLabel = `Modulierte Tonart (${shiftedFrom.camelot} ➔ ${shiftedTo.camelot})`;
  let compatibilityScore = 70;

  if (numFrom === numTo && letFrom === letTo) {
    relationshipType = 'perfect';
    relationshipLabel = `Perfekt Harmonisch (Identisch ${shiftedFrom.camelot})`;
    compatibilityScore = 100;
  } else if (numFrom === numTo && letFrom !== letTo) {
    relationshipType = 'relative';
    relationshipLabel = `Parallele Tonart (${shiftedFrom.camelot} ➔ ${shiftedTo.camelot})`;
    compatibilityScore = 94;
  } else if (fifthDistance === 1 && letFrom === letTo) {
    relationshipType = 'dominant';
    relationshipLabel = `+1 Quinte / Dominante (${shiftedFrom.camelot} ➔ ${shiftedTo.camelot})`;
    compatibilityScore = 90;
  } else if (fifthDistance === -1 && letFrom === letTo) {
    relationshipType = 'subdominant';
    relationshipLabel = `-1 Quarte / Subdominante (${shiftedFrom.camelot} ➔ ${shiftedTo.camelot})`;
    compatibilityScore = 90;
  } else if (semitoneDelta === 1 || semitoneDelta === 2) {
    relationshipType = 'energy_boost';
    relationshipLabel = `Energie-Sprung (+${semitoneDelta} Halbtöne)`;
    compatibilityScore = 82;
  } else if (Math.abs(fifthDistance) <= 2) {
    relationshipType = 'diagonal';
    relationshipLabel = `Diagonale Harmonie (Score ${Math.max(65, 85 - Math.abs(fifthDistance) * 10)}%)`;
    compatibilityScore = Math.max(65, 85 - Math.abs(fifthDistance) * 10);
  } else {
    relationshipType = 'dissonant';
    relationshipLabel = `Modale Reibung / Dissonanz (${shiftedFrom.camelot} ➔ ${shiftedTo.camelot})`;
    compatibilityScore = Math.max(30, 60 - Math.abs(fifthDistance) * 6);
  }

  // Energy delta
  const fromEnergy = fromTrack.intelligence?.energy ?? 60;
  const toEnergy = toTrack.intelligence?.energy ?? 60;
  const energyDeltaPercent = toEnergy - fromEnergy;

  // BPM delta
  const fromBpm = fromTrack.effectiveBpm ?? fromTrack.bpm ?? 128;
  const toBpm = toTrack.effectiveBpm ?? toTrack.bpm ?? 128;
  const bpmDelta = Number((toBpm - fromBpm).toFixed(1));

  return {
    fromKey: shiftedFrom.key,
    fromCamelot: shiftedFrom.camelot,
    toKey: shiftedTo.key,
    toCamelot: shiftedTo.camelot,
    semitoneDelta,
    camelotShift: fifthDistance,
    relationshipType,
    relationshipLabel,
    compatibilityScore,
    energyDeltaPercent,
    bpmDelta,
  };
}

