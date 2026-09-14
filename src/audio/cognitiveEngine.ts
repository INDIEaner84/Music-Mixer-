import {
  CrowdState,
  DeckState,
  FutureStrategyType,
  MusicalDNA,
  MusicalFutureOption,
  SetDirection,
  SetJourneyPoint,
  SetPhase,
  SetState,
  Track,
  TransitionPresetId,
  TransitionStrategyRecommendation,
} from '../types';

/**
 * Camelot key compatibility matrix
 */
const CAMELOT_MAP: Record<string, string> = {
  'A min': '8A',
  'E min': '9A',
  'B min': '10A',
  'F# min': '11A',
  'Db min': '12A',
  'C# min': '12A',
  'Ab min': '1A',
  'G# min': '1A',
  'Eb min': '2A',
  'D# min': '2A',
  'Bb min': '3A',
  'A# min': '3A',
  'F min': '4A',
  'C min': '5A',
  'G min': '6A',
  'D min': '7A',
  'C maj': '8B',
  'G maj': '9B',
  'D maj': '10B',
  'A maj': '11B',
  'E maj': '12B',
  'B maj': '1B',
  'F# maj': '2B',
  'Gb maj': '2B',
  'Db maj': '3B',
  'C# maj': '3B',
  'Ab maj': '4B',
  'Eb maj': '5B',
  'Bb maj': '6B',
  'F maj': '7B',
};

export function getCamelotKey(keyStr: string): string {
  if (!keyStr) return '8A';
  return CAMELOT_MAP[keyStr] || '8A';
}

/**
 * Calculates harmonic compatibility between two keys
 */
export function getHarmonicCompatibility(keyA: string, keyB: string): {
  score: number;
  description: string;
  isCompatible: boolean;
} {
  const camA = getCamelotKey(keyA);
  const camB = getCamelotKey(keyB);

  const numA = parseInt(camA.slice(0, -1), 10);
  const letterA = camA.slice(-1);
  const numB = parseInt(camB.slice(0, -1), 10);
  const letterB = camB.slice(-1);

  if (camA === camB) {
    return { score: 100, description: `Camelot ${camA} ➔ ${camB} (Identische Tonart)`, isCompatible: true };
  }

  const numDiff = Math.abs(numA - numB);
  const wrappedDiff = Math.min(numDiff, 12 - numDiff);

  if (letterA === letterB && wrappedDiff === 1) {
    return { score: 92, description: `Camelot ${camA} ➔ ${camB} (Perfekter 5th-Verwandter)`, isCompatible: true };
  }

  if (numA === numB && letterA !== letterB) {
    return { score: 88, description: `Camelot ${camA} ➔ ${camB} (Dur/Moll Parallel)`, isCompatible: true };
  }

  if (wrappedDiff === 2) {
    return { score: 70, description: `Camelot ${camA} ➔ ${camB} (Modulations-Sprung +2)`, isCompatible: true };
  }

  return { score: 45, description: `Camelot ${camA} ➔ ${camB} (Harmonischer Bruch / Kontrast)`, isCompatible: false };
}

/**
 * Computes live cognitive Set State based on currently playing tracks and performance parameters
 */
export function computeSetState(
  deckA: DeckState,
  deckB: DeckState,
  crossfader: number,
  trackHistoryCount: number,
  elapsedSec: number
): SetState {
  const activeTrack = deckA.isPlaying && deckB.isPlaying
    ? (Math.abs(crossfader) <= 0.3 ? (crossfader < 0 ? deckA.track : deckB.track) : crossfader < 0 ? deckA.track : deckB.track)
    : deckA.isPlaying
    ? deckA.track
    : deckB.isPlaying
    ? deckB.track
    : deckA.track || deckB.track;

  const activeDeck = deckA.isPlaying ? deckA : deckB.isPlaying ? deckB : deckA;

  const baseEnergy = activeTrack?.intelligence?.energy ?? 75;
  const baseTension = activeTrack?.intelligence?.harmonicTension ?? 50;
  const baseDensity = activeTrack?.intelligence?.rhythmicDensity ?? 70;

  // Modulate energy based on playback speed, high/low EQ boosts and kills
  const eqBoost = ((activeDeck.high + activeDeck.mid + activeDeck.low) / 3) * 1.5;
  const filterMod = Math.abs(activeDeck.filter) * 0.15;
  const rateMod = (activeDeck.playbackRate - 1.0) * 100 * 0.8;

  const computedEnergy = Math.min(100, Math.max(10, Math.round(baseEnergy + eqBoost + rateMod - (activeDeck.lowKill ? 20 : 0))));
  const computedTension = Math.min(100, Math.max(10, Math.round(baseTension + filterMod + (activeDeck.isLooping ? 18 : 0))));
  const computedDensity = Math.min(100, Math.max(10, Math.round(baseDensity + (activeDeck.isPlaying && (deckA.isPlaying && deckB.isPlaying) ? 15 : 0))));

  // Set phase determination
  let phase: SetPhase = 'buildup';
  if (elapsedSec < 300 && trackHistoryCount <= 2) {
    phase = 'warmup';
  } else if (computedEnergy >= 88) {
    phase = 'peak';
  } else if (computedTension > 75 && computedEnergy < 70) {
    phase = 'breakdown';
  } else if (trackHistoryCount > 8 && computedEnergy < 60) {
    phase = 'afterhours';
  } else {
    phase = 'buildup';
  }

  // Set direction determination
  let direction: SetDirection = 'flowing';
  if (computedEnergy >= 85) direction = 'peaking';
  else if (computedTension >= 70) direction = 'building';
  else if (activeDeck.isLooping) direction = 'building';
  else if (computedEnergy <= 50) direction = 'cooling';
  else if (activeTrack?.intelligence?.groove === 'hypnotic') direction = 'hypnotic';
  else direction = 'flowing';

  return {
    energy: computedEnergy,
    tension: computedTension,
    density: computedDensity,
    mood: activeTrack?.intelligence?.emotionalTone ?? 'euphoric',
    groove: activeTrack?.intelligence?.groove ?? 'rolling',
    harmonicStability: activeDeck.pitchSemitones === 0 ? 'high' : 'medium',
    direction,
    phase,
    elapsedMinutes: Math.floor(elapsedSec / 60),
    playedTrackCount: trackHistoryCount,
    bpm: activeDeck.bpm || (activeTrack?.bpm ?? 128),
  };
}

/**
 * Generates the 3 Primary Musical Futures (A - FLOW, B - BUILD, C - SHIFT) + SURPRISE + COMBINED MASHUP
 */
export function generateMusicalFutures(
  currentTrack: Track | null,
  allTracks: Track[],
  history: Track[],
  dna: MusicalDNA,
  customIntent?: string
): {
  flow: MusicalFutureOption;
  build: MusicalFutureOption;
  shift: MusicalFutureOption;
  surprise: MusicalFutureOption;
  hybrid: MusicalFutureOption;
} {
  const current = currentTrack || allTracks[0];
  const candidates = allTracks.filter((t) => t.id !== current.id);

  const currentEnergy = current.intelligence?.energy ?? 75;
  const currentBpm = current.bpm;
  const currentKey = current.key;
  const currentGroove = current.intelligence?.groove ?? 'rolling';

  // Sort candidate pool by strategy characteristics
  // 1. FLOW candidate: Closest energy (delta <= 8), highest harmonic compatibility, similar groove
  const flowCandidates = [...candidates].sort((a, b) => {
    const aE = a.intelligence?.energy ?? 70;
    const bE = b.intelligence?.energy ?? 70;
    const aHarm = getHarmonicCompatibility(currentKey, a.key).score;
    const bHarm = getHarmonicCompatibility(currentKey, b.key).score;
    const aBpmDiff = Math.abs(a.bpm - currentBpm);
    const bBpmDiff = Math.abs(b.bpm - currentBpm);

    const scoreA = aHarm * 1.5 - Math.abs(aE - currentEnergy) * 2 - aBpmDiff * 3;
    const scoreB = bHarm * 1.5 - Math.abs(bE - currentEnergy) * 2 - bBpmDiff * 3;
    return scoreB - scoreA;
  });

  const flowTrack = flowCandidates[0] || candidates[0];

  // 2. BUILD candidate: Higher energy (+10 to +25), driving/peak groove, higher intensity
  const buildCandidates = [...candidates].sort((a, b) => {
    const aE = a.intelligence?.energy ?? 70;
    const bE = b.intelligence?.energy ?? 70;
    const aDensity = a.intelligence?.rhythmicDensity ?? 70;
    const bDensity = b.intelligence?.rhythmicDensity ?? 70;
    const aHarm = getHarmonicCompatibility(currentKey, a.key).score;
    const bHarm = getHarmonicCompatibility(currentKey, b.key).score;

    // Prefer tracks with energy higher than current
    const aEnergyBonus = aE > currentEnergy ? (aE - currentEnergy) * 3 : -50;
    const bEnergyBonus = bE > currentEnergy ? (bE - currentEnergy) * 3 : -50;

    const scoreA = aEnergyBonus + aDensity + aHarm * 0.6;
    const scoreB = bEnergyBonus + bDensity + bHarm * 0.6;
    return scoreB - scoreA;
  });

  const buildTrack = buildCandidates.find((t) => t.id !== flowTrack.id) || buildCandidates[0] || candidates[0];

  // 3. SHIFT candidate: Deliberate genre or emotional contrast, different groove/atmosphere
  const shiftCandidates = [...candidates].sort((a, b) => {
    const aGrooveDiff = a.intelligence?.groove !== currentGroove ? 40 : 0;
    const bGrooveDiff = b.intelligence?.groove !== currentGroove ? 40 : 0;
    const aMoodDiff = a.intelligence?.emotionalTone !== current.intelligence?.emotionalTone ? 35 : 0;
    const bMoodDiff = b.intelligence?.emotionalTone !== current.intelligence?.emotionalTone ? 35 : 0;
    const aBpmDiff = Math.abs(a.bpm - currentBpm);
    const bBpmDiff = Math.abs(b.bpm - currentBpm);

    const scoreA = aGrooveDiff + aMoodDiff + (a.intelligence?.harmonicTension ?? 50) - aBpmDiff;
    const scoreB = bGrooveDiff + bMoodDiff + (b.intelligence?.harmonicTension ?? 50) - bBpmDiff;
    return scoreB - scoreA;
  });

  const shiftTrack =
    shiftCandidates.find((t) => t.id !== flowTrack.id && t.id !== buildTrack.id) ||
    shiftCandidates[0] ||
    candidates[0];

  // 4. SURPRISE candidate: Highest contrast, outside typical recommendations
  const surpriseCandidates = [...candidates].sort((a, b) => {
    const aHarm = getHarmonicCompatibility(currentKey, a.key).score;
    const bHarm = getHarmonicCompatibility(currentKey, b.key).score;
    const aBpmDiff = Math.abs(a.bpm - currentBpm);
    const bBpmDiff = Math.abs(b.bpm - currentBpm);
    // Surprise favors unexpected key + unexpected groove + tempo jump
    const scoreA = (100 - aHarm) + (a.intelligence?.harmonicTension ?? 50) + aBpmDiff * 0.8;
    const scoreB = (100 - bHarm) + (b.intelligence?.harmonicTension ?? 50) + bBpmDiff * 0.8;
    return scoreB - scoreA;
  });

  const surpriseTrack =
    surpriseCandidates.find((t) => t.id !== flowTrack.id && t.id !== buildTrack.id && t.id !== shiftTrack.id) ||
    surpriseCandidates[0] ||
    candidates[0];

  // Construct Option A - FLOW
  const flowHarm = getHarmonicCompatibility(currentKey, flowTrack.key);
  const flowEnergyDelta = (flowTrack.intelligence?.energy ?? 70) - currentEnergy;
  const flowOption: MusicalFutureOption = {
    id: 'future-flow',
    strategy: 'flow',
    badgeLabel: 'A — FLOW',
    headline: 'Nahtlose Fortsetzung & Harmonischer Fluss',
    feeling: '„Der Abend fließt nahtlos weiter.“',
    explanation: `Perfekte harmonische Tonart-Passung (${flowHarm.description}) mit identischer Groove-Struktur (${flowTrack.intelligence?.groove ?? 'rolling'}). Bewahrt den aktuellen Flow und hält die Tänzer in Trance.`,
    track: flowTrack,
    compatibilityScore: Math.min(99, Math.max(85, flowHarm.score + 5)),
    harmonicMatch: flowHarm.description,
    energyDelta: flowEnergyDelta >= 0 ? `+${flowEnergyDelta}% Stetige Energie` : `${flowEnergyDelta}% Sanftes Ausklingen`,
    bpmDelta: `${flowTrack.bpm === currentBpm ? '0 BPM (Exakt synchron)' : `${flowTrack.bpm > currentBpm ? '+' : ''}${flowTrack.bpm - currentBpm} BPM`}`,
    recommendedTransition: {
      presetId: 'crossfade',
      strategyName: 'blend',
      germanStrategyTitle: 'Harmonischer 8-Takt Blend',
      rationale: 'Klassischer Frequenz-Austausch bei Takt 16 während der Vocal-Pause.',
      stepRecipe: [
        'Track A läuft auf Master (Deck A)',
        'Track B synchronisieren und bei Phrase 1 einstarten',
        'EQ High/Mid von Track B schrittweise reindrehen',
        'Bass-Frequenzen bei Takt 8 nahtlos überblenden',
      ],
    },
    cognitiveRationale: {
      rhythmImpact: 'Konsistente Kickdrum-Präsenz ohne rhythmischen Ruck.',
      vocalTension: 'Vocal-Schichten greifen sauber ineinander.',
      crowdEffect: 'Sichert anhaltende Bewegung ohne Ermüdung.',
    },
  };

  // Construct Option B - BUILD
  const buildHarm = getHarmonicCompatibility(currentKey, buildTrack.key);
  const buildEnergyDelta = (buildTrack.intelligence?.energy ?? 88) - currentEnergy;
  const buildOption: MusicalFutureOption = {
    id: 'future-build',
    strategy: 'build',
    badgeLabel: 'B — BUILD',
    headline: 'Energie-Eskalation & Peak-Hour Rhythmus',
    feeling: '„Wir bauen den Dancefloor zur Ekstase auf.“',
    explanation: `Steigert die Rhythmus-Dichte und Intensität um +${Math.max(10, buildEnergyDelta)}%. Bringt eine härtere Basslinie (${buildTrack.intelligence?.atmosphere ?? 'Peak Club'}) und treibt die Tanzfläche auf den Höhepunkt.`,
    track: buildTrack,
    compatibilityScore: Math.min(96, Math.max(78, buildHarm.score - 5 + 15)),
    harmonicMatch: buildHarm.description,
    energyDelta: `+${Math.max(8, buildEnergyDelta)}% Energie-Explosion`,
    bpmDelta: `${buildTrack.bpm > currentBpm ? `+${buildTrack.bpm - currentBpm} BPM Rhythmus-Beschleunigung` : 'Gleiches Tempo, höhere Dichte'}`,
    recommendedTransition: {
      presetId: 'bass-swap',
      strategyName: 'build',
      germanStrategyTitle: 'Bass-Drop Swap mit Tension-Riser',
      rationale: 'Loop-Aufbau in Track A, Filter-Sweep nach oben und punktgenauer Bass-Swap auf den Drop.',
      stepRecipe: [
        'Track A in 4-Takt Loop fangen & High-Pass Filter öffnen',
        'Track B Buildup zeitgleich mitlaufen lassen',
        'Spannung auf 100% steigern',
        'Drop auf Takt 1: Deck A sofort killen, Deck B Full Bass knallen lassen',
      ],
    },
    cognitiveRationale: {
      rhythmImpact: 'Härtere Transienten und stärkere Sub-Frequenzen.',
      vocalTension: 'Spannungsaufbau durch isolierte Riser & Drops.',
      crowdEffect: 'Löst euphorische Reaktionen und kollektiven Jubel aus.',
    },
  };

  // Construct Option C - SHIFT
  const shiftHarm = getHarmonicCompatibility(currentKey, shiftTrack.key);
  const shiftEnergyDelta = (shiftTrack.intelligence?.energy ?? 70) - currentEnergy;
  const shiftOption: MusicalFutureOption = {
    id: 'future-shift',
    strategy: 'shift',
    badgeLabel: 'C — SHIFT',
    headline: 'Kontrollierter Richtungswechsel & Neuer Groove',
    feeling: '„Jetzt passiert etwas Unerwartetes.“',
    explanation: `Bricht das bisherige Muster mit neuem Groove-Genre (${shiftTrack.intelligence?.genre ?? 'Acid & Broken'}) und frischer Atmosphäre. Setzt ein dramatisches Statement im Set.`,
    track: shiftTrack,
    compatibilityScore: 84,
    harmonicMatch: shiftHarm.description,
    energyDelta: `${shiftEnergyDelta >= 0 ? '+' : ''}${shiftEnergyDelta}% Dynamischer Kontrast`,
    bpmDelta: `${shiftTrack.bpm - currentBpm !== 0 ? `${shiftTrack.bpm > currentBpm ? '+' : ''}${shiftTrack.bpm - currentBpm} BPM Tempowechsel` : 'Modulierter Beat-Pattern'}`,
    recommendedTransition: {
      presetId: 'hpf-sweep',
      strategyName: 'cut',
      germanStrategyTitle: 'Filter-Sweep & Echo Break-Cut',
      rationale: 'Unerwarteter Klangfarben-Wechsel durch Hall-Fahne und rhythmischen Neubeginn.',
      stepRecipe: [
        'Track A mit Tape-Echo und Reverb anfetten',
        'Low-Cut Filter radikal hochziehen, Sound in den Raum werfen',
        '1 Takt Stille oder Solo-Vocal',
        'Track B mit wuchtigem Beat-Einschlag starten',
      ],
    },
    cognitiveRationale: {
      rhythmImpact: 'Plötzlicher Rhythmus-Kontrast erneuert die Hör-Aufmerksamkeit.',
      vocalTension: 'Stilbruch erzeugt Neugier und Frische.',
      crowdEffect: 'Verhindert Floor-Monotonie und setzt ein Highlight.',
    },
  };

  // Construct SURPRISE Option
  const surpriseHarm = getHarmonicCompatibility(currentKey, surpriseTrack.key);
  const surpriseOption: MusicalFutureOption = {
    id: 'future-surprise',
    strategy: 'surprise',
    badgeLabel: '🎲 SURPRISE ENGINE',
    headline: 'Mutiger Außenseiter & Ungewöhnliche Synthese',
    feeling: '„Völlig unerwartet, aber es zündet.“',
    explanation: `Die KI verlässt bewusst den gewohnten Suchraum: Ungewöhnlicher Kontrast (${surpriseTrack.title} • ${surpriseTrack.intelligence?.genre}), der durch geschicktes Stem-Filtering zu einem unvergesslichen Moment wird.`,
    track: surpriseTrack,
    compatibilityScore: 78,
    harmonicMatch: surpriseHarm.description,
    energyDelta: 'Kontrast-Sprung',
    bpmDelta: `${surpriseTrack.bpm} BPM (${surpriseTrack.bpm - currentBpm >= 0 ? '+' : ''}${surpriseTrack.bpm - currentBpm})`,
    recommendedTransition: {
      presetId: 'echo-out',
      strategyName: 'cut',
      germanStrategyTitle: 'Spinback & Echo-Out Drop',
      rationale: 'Vinyl-Brake oder Backspin auf Deck A, Echo-Tail fängt den Raum, Track B schlägt ein.',
      stepRecipe: [
        'Backspin oder Tape-Stop auf Deck A',
        'Reverb-Freeze füllt die Pause',
        'Track B Drop startet direkt auf Eins',
      ],
    },
    cognitiveRationale: {
      rhythmImpact: 'Dramatischer Schock-Moment mit hohem Erinnerungswert.',
      vocalTension: 'Radikaler Stimmungswechsel.',
      crowdEffect: 'Überraschungsmoment mit Begeisterungspotenzial.',
    },
  };

  // Construct COMBINED MASHUP (A + C)
  const hybridOption: MusicalFutureOption = {
    id: 'future-hybrid',
    strategy: 'hybrid',
    badgeLabel: '✨ HYBRID MASHUP (A + C)',
    headline: `Vocal von "${flowTrack.title}" + Bass von "${shiftTrack.title}"`,
    feeling: '„Zwei Welten verschmelzen zu einem neuen Song.“',
    explanation: `Erzeugt eine exklusive Live-Synthese: Nimmt die melodischen Elemente & Vocals aus ${flowTrack.title} und unterlegt sie mit dem treibenden Bassfundament von ${shiftTrack.title}.`,
    track: flowTrack,
    mashupTrack: shiftTrack,
    compatibilityScore: 94,
    harmonicMatch: 'Harmonisch isolierte Stem-Schichtung',
    energyDelta: '+18% Hybrid-Power',
    bpmDelta: 'Auto-Sync auf Master-Tempo',
    recommendedTransition: {
      presetId: 'vocal-mashup',
      strategyName: 'blend',
      germanStrategyTitle: '3-Kanal Stem-Layer Injektion',
      rationale: 'Deck A Beat läuft weiter, Deck B spielt Vocals, Stem Layer 3 feuert den Sub-Bass.',
      stepRecipe: [
        'Deck A auf Beat-Stem isolieren (Low/Mid Kick & Hat)',
        'Track B im Vocal-Modus als Melodie-Lead einblenden',
        'Stem Layer 3 mit Bassline von Track C injizieren',
        'Vollwertiges Live-Mashup erzeugen',
      ],
    },
    cognitiveRationale: {
      rhythmImpact: 'Maximaler Druck durch doppelten Rhythmus-Layer.',
      vocalTension: 'Bekannte Vocals auf völlig neuem Beat-Fundament.',
      crowdEffect: 'Exklusiver Festival-Mashup-Effekt.',
    },
  };

  return {
    flow: flowOption,
    build: buildOption,
    shift: shiftOption,
    surprise: surpriseOption,
    hybrid: hybridOption,
  };
}

/**
 * Parses natural language input or intent prompt into cognitive weighting
 */
export function parseMusicalIntent(prompt: string): {
  targetEnergy?: number;
  targetTension?: number;
  targetGroove?: string;
  targetMood?: string;
  preferredStrategy: FutureStrategyType;
  coPilotMessage: string;
} {
  const p = prompt.toLowerCase();

  if (p.includes('peak') || p.includes('energie') || p.includes('aufbauen') || p.includes('gas geben') || p.includes('feuer')) {
    return {
      targetEnergy: 95,
      targetTension: 85,
      preferredStrategy: 'build',
      coPilotMessage: 'Intent erkannt: ⚡ Maximaler Peak-Hour Aufbau. Höhere Rhythmus-Dichte und Bass-Druck priorisiert.',
    };
  }

  if (p.includes('dunkel') || p.includes('dark') || p.includes('acid') || p.includes('underground') || p.includes('techno')) {
    return {
      targetEnergy: 85,
      targetTension: 80,
      targetMood: 'dark',
      preferredStrategy: 'shift',
      coPilotMessage: 'Intent erkannt: 🌑 Dunkle, hypnotische Club-Atmosphäre & Acid-Synthesizer ausgewählt.',
    };
  }

  if (p.includes('zurück') || p.includes('floor') || p.includes('retten') || p.includes('einfangen')) {
    return {
      targetEnergy: 88,
      targetGroove: 'driving',
      preferredStrategy: 'build',
      coPilotMessage: 'Intent erkannt: 🧲 Crowd Re-Engagement. Treibender Groove mit bewährter Tanzbarkeit ausgewählt.',
    };
  }

  if (p.includes('überrasch') || p.includes('surprise') || p.includes('anders') || p.includes('neu')) {
    return {
      preferredStrategy: 'surprise',
      coPilotMessage: 'Intent erkannt: 🎲 Surprise Engine aktiviert. Unerwartete Stile & Genrebrüche werden vorgeschlagen.',
    };
  }

  if (p.includes('ruhig') || p.includes('chill') || p.includes('sunset') || p.includes('melodic') || p.includes('deep')) {
    return {
      targetEnergy: 55,
      targetMood: 'warm',
      preferredStrategy: 'flow',
      coPilotMessage: 'Intent erkannt: 🌅 Sanfter, melodischer Flow für entspanntes Vorantreiben der Stimmung.',
    };
  }

  return {
    preferredStrategy: 'flow',
    coPilotMessage: `Intent verarbeitet: "${prompt}". Vorschläge wurden kognitiv neu gerankt.`,
  };
}

/**
 * Updates dynamic Musical DNA profile
 */
export function updateMusicalDNA(
  currentDna: MusicalDNA,
  choice: FutureStrategyType,
  chosenTrack: Track
): MusicalDNA {
  const next = { ...currentDna };

  if (choice === 'flow') {
    next.continuity = Math.min(1.0, next.continuity + 0.08);
    next.harmonic_matching = Math.min(1.0, next.harmonic_matching + 0.07);
    next.experimentation = Math.max(0.1, next.experimentation - 0.03);
  } else if (choice === 'build') {
    next.energy_growth = Math.min(1.0, next.energy_growth + 0.1);
    next.continuity = Math.min(1.0, next.continuity + 0.04);
  } else if (choice === 'shift') {
    next.experimentation = Math.min(1.0, next.experimentation + 0.12);
    next.genre_stability = Math.max(0.1, next.genre_stability - 0.08);
    next.surprise = Math.min(1.0, next.surprise + 0.06);
  } else if (choice === 'surprise') {
    next.surprise = Math.min(1.0, next.surprise + 0.18);
    next.experimentation = Math.min(1.0, next.experimentation + 0.15);
    next.continuity = Math.max(0.1, next.continuity - 0.1);
  } else if (choice === 'hybrid') {
    next.experimentation = Math.min(1.0, next.experimentation + 0.1);
    next.energy_growth = Math.min(1.0, next.energy_growth + 0.08);
  }

  next.decisionHistory = [
    ...next.decisionHistory.slice(-10),
    {
      timestamp: Date.now(),
      strategy: choice,
      trackTitle: chosenTrack.title,
      energy: chosenTrack.intelligence?.energy ?? 75,
    },
  ];

  return next;
}

/**
 * Calculates crowd telemetry state
 */
export function calculateCrowdState(
  setState: SetState,
  transitionActive: boolean
): CrowdState {
  let engagement = 80;
  let movement = 75;
  let attention = 82;
  let fatigue = 20;

  if (setState.energy > 85) {
    engagement = 94;
    movement = 92;
    attention = 96;
    fatigue = 32;
  } else if (setState.energy > 70) {
    engagement = 84;
    movement = 80;
    attention = 88;
    fatigue = 22;
  } else {
    engagement = 68;
    movement = 60;
    attention = 75;
    fatigue = 15;
  }

  if (transitionActive) {
    engagement = Math.min(98, engagement + 8);
    attention = Math.min(98, attention + 10);
  }

  let response: 'extatisch' | 'stark' | 'aufmerksam' | 'ermüdend' | 'wartend' = 'stark';
  let vibeDescription = 'Der Dancefloor ist gut gefüllt und folgt aufmerksam dem Rhythmus.';
  let coPilotAdvisory = 'Stabiler Rhythmus. Bereit für den nächsten Energie-Schritt.';

  if (setState.phase === 'peak') {
    response = 'extatisch';
    vibeDescription = 'Hände in der Luft, intensive Resonanz auf Drop-Elemente!';
    coPilotAdvisory = 'Peak-Hour erreicht! Halte die Spannung noch 2-3 Tracks, bevor ein Breakdown nötig wird.';
  } else if (setState.phase === 'breakdown') {
    response = 'aufmerksam';
    vibeDescription = 'Hörbare Erleichterung & Vorfreude auf den nächsten Beat-Einschlag.';
    coPilotAdvisory = 'Spannung bei 85% — Jetzt ist der optimale Moment für den Bass-Drop Swap!';
  } else if (setState.phase === 'warmup') {
    response = 'aufmerksam';
    vibeDescription = 'Gäste kommen an, entspanntes Kopfnicken und erster Groove.';
    coPilotAdvisory = 'Gute Basis. Steigere das Tempo langsam um +2 BPM für den ersten Buildup.';
  }

  return {
    engagement,
    movement,
    attention,
    fatigue,
    responseToBuildup: response,
    vibeDescription,
    coPilotAdvisory,
  };
}

/**
 * Generates Energy Journey points (Past History + NOW + Projected Future Paths)
 */
export function generateEnergyJourney(
  history: Track[],
  currentTrack: Track | null,
  futures: { flow: MusicalFutureOption; build: MusicalFutureOption; shift: MusicalFutureOption }
): SetJourneyPoint[] {
  const points: SetJourneyPoint[] = [];

  // 1. History points
  const pastList = history.slice(-4);
  pastList.forEach((t, i) => {
    points.push({
      index: i,
      trackTitle: t.title,
      artist: t.artist,
      energy: t.intelligence?.energy ?? 65 + i * 4,
      tension: t.intelligence?.harmonicTension ?? 40 + i * 5,
      timeLabel: `-${(pastList.length - i) * 3} min`,
      isPast: true,
      isCurrent: false,
      color: t.color || '#6b7280',
    });
  });

  // 2. NOW Current point
  const current = currentTrack || history[history.length - 1] || { title: 'Live Deck', artist: 'Active', intelligence: { energy: 75, harmonicTension: 50 }, color: '#06b6d4' };
  const currentIndex = points.length;
  points.push({
    index: currentIndex,
    trackTitle: current.title,
    artist: current.artist,
    energy: current.intelligence?.energy ?? 75,
    tension: current.intelligence?.harmonicTension ?? 50,
    timeLabel: 'JETZT (LIVE)',
    isPast: false,
    isCurrent: true,
    color: '#06b6d4',
  });

  return points;
}
