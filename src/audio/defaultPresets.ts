import { EffectSetting, SamplePad, TransitionPreset } from '../types';

export const TRANSITION_PRESETS: TransitionPreset[] = [
  {
    id: 'crossfade',
    name: 'Smooth Crossfade',
    germanName: 'Nahtlose Lautstärke-Überblendung',
    description: 'Constant-power harmonic volume blend preserving master floor energy.',
    iconName: 'Sliders',
    defaultDurationBars: 8,
    category: 'Smooth',
    explanation: {
      howItWorks:
        'Klassischer, harmonischer Übergang mit Constant-Power-Kurve. Beide Titel behalten ihren Frequenzgang, während Deck A sanft ausgeblendet und Deck B zeitgleich gleichmäßig eingeblendet wird, ohne Lautstärkeeinbrüche in der Mitte.',
      stepByStep: [
        '0% - 25%: Deck B startet leise im Hintergrund, Gain steigt gleichmäßig an.',
        '25% - 75%: Beide Tracks spielen mit je 70.7% Lautstärke (Constant Power Summe = 100%).',
        '75% - 100%: Deck A fadet vollständig aus, Deck B übernimmt den Master-Fokus.',
      ],
      bestFor: 'Harmonische Intros/Outros, Vocal House, Disco, Nu-Disco, Deep House.',
      dspActions: ['Crossfader Interpolation', 'Constant-Power Gain Curve', 'Stereo Panning Balance'],
    },
    curves: [
      { timeRatio: 0.0, deckAGain: 1.0, deckBGain: 0.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
      { timeRatio: 0.25, deckAGain: 0.92, deckBGain: 0.38, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
      { timeRatio: 0.5, deckAGain: 0.71, deckBGain: 0.71, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
      { timeRatio: 0.75, deckAGain: 0.38, deckBGain: 0.92, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
      { timeRatio: 1.0, deckAGain: 0.0, deckBGain: 1.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
    ],
  },
  {
    id: 'bass-swap',
    name: 'Bassline Drop Swap',
    germanName: 'Bass-Tausch / Bass-Drop Crossover',
    description: 'Blends highs and mids, then executes an instant bass frequency swap on the 1-beat drop.',
    iconName: 'Zap',
    defaultDurationBars: 4,
    category: 'Club FX',
    explanation: {
      howItWorks:
        'Verhindert Phasenlöschungen und Bassmatsch im Sub-Bereich: Deck B wird mit gedämpftem Bass hineingemischt. Exakt auf dem Drop (1-Takt Crossover) wird der Bass von Deck A schlagartig auf -24 dB gekillt und der Bass von Deck B voll freigeschaltet.',
      stepByStep: [
        '0% - 50%: Deck B Höhen & Mitten faden ein, Bass von Deck B bleibt auf -18 dB gecuttet.',
        '50% (Der Drop): Blitzschneller Bass-Tausch (Deck A Low ➔ -24 dB, Deck B Low ➔ 0 dB).',
        '50% - 100%: Mitten & Höhen von Deck A faden aus, Deck B hat die volle Kick/Bass-Power.',
      ],
      bestFor: 'Tech House, Peak-Time Techno, EDM, Bass House, Drum & Bass.',
      dspActions: ['3-Band Low EQ Crossover', 'Sub-frequency phase alignment', 'Gain balancing'],
    },
    curves: [
      { timeRatio: 0.0, deckAGain: 1.0, deckBGain: 0.0, deckALow: 0, deckBLow: -24, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
      { timeRatio: 0.45, deckAGain: 0.85, deckBGain: 0.7, deckALow: 0, deckBLow: -20, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.1 },
      { timeRatio: 0.5, deckAGain: 0.7, deckBGain: 0.85, deckALow: -24, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.3 },
      { timeRatio: 0.8, deckAGain: 0.3, deckBGain: 1.0, deckALow: -24, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.1 },
      { timeRatio: 1.0, deckAGain: 0.0, deckBGain: 1.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
    ],
  },
  {
    id: 'echo-out',
    name: 'Dub Echo & Tail Out',
    germanName: 'Tape Delay Dub Echo & Freeze',
    description: 'Cuts outgoing low frequencies and freezes a synced delay wash into the next track.',
    iconName: 'Repeat',
    defaultDurationBars: 4,
    category: 'Club FX',
    explanation: {
      howItWorks:
        'Der ausgehende Track wird mit einem synchronisierten 3/4- oder 1/2-Beat Tape-Delay belegt. Exakt beim Taktwechsel wird das Direktsignal von Deck A abgeschnitten, während die Echo-Fahne räumlich in Deck B nachhallt und ausklingt.',
      stepByStep: [
        '0% - 30%: Echo-Send auf Deck A wird hochgefahren, Feedback steigt.',
        '40%: Deck A Tiefpassfilter & Muting aktivieren den Delay-Freeze.',
        '40% - 100%: Deck B startet kraftvoll ohne Frequenzüberlagerung, Delay fadet sanft ab.',
      ],
      bestFor: 'Genre-Sprünge, Tempi-Wechsel, Hip-Hop zu House, Radio & Club Transitions.',
      dspActions: ['BPM-Synced Delay', 'High-Pass Cutoff', 'Feedback Freeze Loop', 'Dry/Wet Crossfade'],
    },
    curves: [
      { timeRatio: 0.0, deckAGain: 1.0, deckBGain: 0.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
      { timeRatio: 0.35, deckAGain: 0.9, deckBGain: 0.6, deckALow: -6, deckBLow: 0, deckAFilter: 15, deckBFilter: 0, fxIntensity: 0.4 },
      { timeRatio: 0.4, deckAGain: 0.0, deckBGain: 1.0, deckALow: -24, deckBLow: 0, deckAFilter: 40, deckBFilter: 0, fxIntensity: 0.95 },
      { timeRatio: 0.75, deckAGain: 0.0, deckBGain: 1.0, deckALow: -24, deckBLow: 0, deckAFilter: 60, deckBFilter: 0, fxIntensity: 0.4 },
      { timeRatio: 1.0, deckAGain: 0.0, deckBGain: 1.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
    ],
  },
  {
    id: 'hpf-sweep',
    name: 'Resonant HPF Sweep',
    germanName: 'Resonanter High-Pass Filter Riser',
    description: 'Rising resonant high-pass filter sweep building tension before dropping clean.',
    iconName: 'Activity',
    defaultDurationBars: 8,
    category: 'Energetic',
    explanation: {
      howItWorks:
        'Ein kontinuierlich ansteigender Hochpassfilter (HPF) schneidet schrittweise Bass und Mitten von Deck A ab, während die Resonanz (Q) für einen pfeifenden Club-Riser sorgt. Auf den Drop schaltet Deck B mit vollem Druck ein.',
      stepByStep: [
        '0% - 40%: Filter von Deck A öffnet von 20 Hz bis 500 Hz, Bass verschwindet subtil.',
        '40% - 80%: Filter fegt bis 2.5 kHz mit hoher Resonanz (Club Riser Effekt), Deck B fadet ein.',
        '80% - 100%: Filter erreicht 12 kHz, Deck A mutet und Deck B explodiert mit vollem Spektrum.',
      ],
      bestFor: 'Techno Buildups, Progressive House, Trance, Festival Drops.',
      dspActions: ['Biquad Highpass Filter', 'Resonance Q-Peaking', 'Linear Volume Fade'],
    },
    curves: [
      { timeRatio: 0.0, deckAGain: 1.0, deckBGain: 0.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
      { timeRatio: 0.3, deckAGain: 0.95, deckBGain: 0.3, deckALow: -10, deckBLow: 0, deckAFilter: 25, deckBFilter: 0, fxIntensity: 0.2 },
      { timeRatio: 0.7, deckAGain: 0.8, deckBGain: 0.75, deckALow: -24, deckBLow: 0, deckAFilter: 65, deckBFilter: 0, fxIntensity: 0.7 },
      { timeRatio: 0.95, deckAGain: 0.2, deckBGain: 0.98, deckALow: -24, deckBLow: 0, deckAFilter: 90, deckBFilter: 0, fxIntensity: 0.9 },
      { timeRatio: 1.0, deckAGain: 0.0, deckBGain: 1.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
    ],
  },
  {
    id: 'brake-drop',
    name: 'Vinyl Turntable Brake',
    germanName: 'Plattenspieler Motor-Stopp (Brake)',
    description: 'Motor brake spin-down tape stop on outgoing deck while slamming incoming track.',
    iconName: 'Disc',
    defaultDurationBars: 2,
    category: 'Drop',
    explanation: {
      howItWorks:
        'Simuliert das Ausschalten des Plattenspieler-Motors (Vinyl Brake). Die Abspielgeschwindigkeit von Deck A verlangsamt sich exponentiell bis zum Stillstand mit tiefem Pitch-Down, während Deck B auf den 1-Beat direkt einsetzt.',
      stepByStep: [
        '0% - 20%: Deck A läuft normal, Deck B steht auf Cue-Point bereit.',
        '20% - 60%: Pitch-Bremse greift: Geschwindigkeit sinkt von 100% auf 0% mit typischem Vinyl-Stopp-Sound.',
        '60% - 100%: Deck B startet schlagartig mit voller Lautstärke.',
      ],
      bestFor: 'Hip-Hop, Trap, Scratch Transitions, Überraschende Stimmungswechsel.',
      dspActions: ['Exponential Playback Rate Decay', 'Tape Stop Simulation', 'Instant Hard-Cut Fader'],
    },
    curves: [
      { timeRatio: 0.0, deckAGain: 1.0, deckBGain: 0.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
      { timeRatio: 0.2, deckAGain: 1.0, deckBGain: 0.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.2 },
      { timeRatio: 0.5, deckAGain: 0.7, deckBGain: 0.8, deckALow: -12, deckBLow: 0, deckAFilter: -20, deckBFilter: 0, fxIntensity: 0.8 },
      { timeRatio: 0.7, deckAGain: 0.0, deckBGain: 1.0, deckALow: -24, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.1 },
      { timeRatio: 1.0, deckAGain: 0.0, deckBGain: 1.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
    ],
  },
  {
    id: 'loop-roll',
    name: 'Loop Roll Stutter Build',
    germanName: 'Loop-Roll Takt-Verkürzung (Stutter)',
    description: 'Rhythmic loop reduction (1 bar -> 1/2 -> 1/4 -> 1/8 -> 1/16) buildup crossover.',
    iconName: 'Layers',
    defaultDurationBars: 4,
    category: 'Energetic',
    explanation: {
      howItWorks:
        'Erzeugt einen dramatischen Rhythmus-Wirbel: Deck A wird in einer Schleife gefangen, deren Länge sich bei jedem Takt halbiert (1 Takt ➔ 1/2 ➔ 1/4 ➔ 1/8 ➔ 1/16 Takt-Roll), bis der nächste Song einschlägt.',
      stepByStep: [
        'Takt 1: 1-Takt Loop aktiviert.',
        'Takt 2: Loop springt auf 1/2 Takt, Filter steigt leicht.',
        'Takt 3: Loop halbiert auf 1/4 und 1/8 Takt (Snare-Roll Intensität).',
        'Takt 4 Drop: 1/16 Maschinengewehr-Stutter ➔ Deck B startet auf die 1.',
      ],
      bestFor: 'EDM, Future House, Bassline, Big Room Drops.',
      dspActions: ['Real-time Buffer Looping', 'Loop Length Division', 'High-Pass Riser Sweep'],
    },
    curves: [
      { timeRatio: 0.0, deckAGain: 1.0, deckBGain: 0.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
      { timeRatio: 0.3, deckAGain: 0.9, deckBGain: 0.2, deckALow: -4, deckBLow: 0, deckAFilter: 15, deckBFilter: 0, fxIntensity: 0.3 },
      { timeRatio: 0.6, deckAGain: 0.8, deckBGain: 0.6, deckALow: -12, deckBLow: 0, deckAFilter: 40, deckBFilter: 0, fxIntensity: 0.6 },
      { timeRatio: 0.9, deckAGain: 0.5, deckBGain: 0.9, deckALow: -24, deckBLow: 0, deckAFilter: 70, deckBFilter: 0, fxIntensity: 0.9 },
      { timeRatio: 1.0, deckAGain: 0.0, deckBGain: 1.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
    ],
  },
  {
    id: 'washout',
    name: 'Reverb Washout',
    germanName: 'Atmosphärischer Reverb Washout',
    description: 'Envelopes outgoing deck in massive diffuse reverb space for atmospheric shift.',
    iconName: 'Wind',
    defaultDurationBars: 8,
    category: 'Smooth',
    explanation: {
      howItWorks:
        'Hüllt den ausgehenden Track in eine riesige Kathedralen-Hallwolke ein. Während das Originalsignal im Nebel verschwimmt und die tiefen Frequenzen gereinigt werden, tritt der neue Track kristallklar in den Vordergrund.',
      stepByStep: [
        '0% - 40%: Reverb Wet steigt von 0% auf 80%, Bass wird schrittweise abgesenkt.',
        '40% - 70%: Deck A klingt wie aus weiter Ferne im Hallraum.',
        '70% - 100%: Deck B übernimmt den trockenen, druckvollen Vordergrund.',
      ],
      bestFor: 'Melodic Techno, Ambient, Vocal Breakdowns, Chillout, Organic House.',
      dspActions: ['Algorithmic Convolver / Diffuse Reverb', 'High-Pass Damping', 'Stereo Width Expansion'],
    },
    curves: [
      { timeRatio: 0.0, deckAGain: 1.0, deckBGain: 0.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
      { timeRatio: 0.3, deckAGain: 0.9, deckBGain: 0.3, deckALow: -8, deckBLow: 0, deckAFilter: 20, deckBFilter: 0, fxIntensity: 0.4 },
      { timeRatio: 0.6, deckAGain: 0.7, deckBGain: 0.7, deckALow: -20, deckBLow: 0, deckAFilter: 50, deckBFilter: 0, fxIntensity: 0.85 },
      { timeRatio: 0.85, deckAGain: 0.2, deckBGain: 0.95, deckALow: -24, deckBLow: 0, deckAFilter: 70, deckBFilter: 0, fxIntensity: 0.6 },
      { timeRatio: 1.0, deckAGain: 0.0, deckBGain: 1.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
    ],
  },
  {
    id: 'flanger-fade',
    name: 'Jet Flanger Swirl',
    germanName: 'Jet Flanger Stereo-Sweep',
    description: 'Wide stereo flanger jet sweep during the crossover transition.',
    iconName: 'Waves',
    defaultDurationBars: 4,
    category: 'Club FX',
    explanation: {
      howItWorks:
        'Erzeugt den charakteristischen "Düsenjet"-Kammfilter-Effekt über beiden Tracks. Der Sweep erzeugt intensive Bewegung im Stereofeld und maskiert tonale Übergänge zwischen unterschiedlichen Tonarten.',
      stepByStep: [
        '0% - 30%: Stereo Flanger LFO beschleunigt, Phasenmodulation setzt ein.',
        '30% - 70%: Kammfilter-Sweep überlagert beide Decks auf dem Höhepunkt.',
        '70% - 100%: Modulation klingt ab und hinterlässt das saubere Signal von Deck B.',
      ],
      bestFor: 'Classic French House, Disco House, Synthwave, Electro.',
      dspActions: ['Comb Filtering', 'Stereo LFO Delay Modulation', 'Harmonic Masking'],
    },
    curves: [
      { timeRatio: 0.0, deckAGain: 1.0, deckBGain: 0.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
      { timeRatio: 0.3, deckAGain: 0.85, deckBGain: 0.4, deckALow: -4, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.6 },
      { timeRatio: 0.5, deckAGain: 0.7, deckBGain: 0.7, deckALow: -10, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.95 },
      { timeRatio: 0.8, deckAGain: 0.3, deckBGain: 0.9, deckALow: -20, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.4 },
      { timeRatio: 1.0, deckAGain: 0.0, deckBGain: 1.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
    ],
  },
  {
    id: 'backspin',
    name: 'Turntable Backspin',
    germanName: 'Vinyl Backspin / Rewind Drop',
    description: 'Rewinds outgoing vinyl with high-pitch speed spin before dropping the new beat.',
    iconName: 'RotateCcw',
    defaultDurationBars: 2,
    category: 'Drop',
    explanation: {
      howItWorks:
        'Der legendäre Hip-Hop & Reggae Soundclash Rewind: Der DJ dreht die Platte rückwärts mit hoher Geschwindigkeit ("Wheel up / Pull up"), woraufhin Track B mit maximalem Impact auf den ersten Beat startet.',
      stepByStep: [
        '0% - 20%: Track A läuft normal.',
        '20% - 50%: Manueller Backspin-Sound: Tonhöhe schießt nach oben und fadet mit Rückwärts-Spin ab.',
        '50% - 100%: Deck B droppt mit voller Lautstärke in den Club.',
      ],
      bestFor: 'Hip Hop, Dancehall, Drum & Bass, UK Garage, Soundclash DJing.',
      dspActions: ['Reverse Playback Buffering', 'Pitch-Shift Ramp Up & Down', 'Fast Cut Fader'],
    },
    curves: [
      { timeRatio: 0.0, deckAGain: 1.0, deckBGain: 0.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
      { timeRatio: 0.25, deckAGain: 1.0, deckBGain: 0.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.3 },
      { timeRatio: 0.5, deckAGain: 0.6, deckBGain: 0.8, deckALow: -16, deckBLow: 0, deckAFilter: 30, deckBFilter: 0, fxIntensity: 0.9 },
      { timeRatio: 0.65, deckAGain: 0.0, deckBGain: 1.0, deckALow: -24, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.1 },
      { timeRatio: 1.0, deckAGain: 0.0, deckBGain: 1.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
    ],
  },
  {
    id: 'stutter-cut',
    name: '16th Stutter Gate',
    germanName: '16tel Rhythmus-Gater Stutter Cut',
    description: 'Rhythmic audio chopper gating on outgoing track prior to the drop.',
    iconName: 'Scissors',
    defaultDurationBars: 4,
    category: 'Drop',
    explanation: {
      howItWorks:
        'Zerhackt das Audiosignal von Deck A synchron im 1/16-Taktmuster (Tremolo / Gating). Die Lücken schaffen Raum im Mix, während Deck B sich aufbaut und beim Abbruch des Stutters sauber übernimmt.',
      stepByStep: [
        '0% - 30%: Deck B fadet mit gedämpften Bässen ein.',
        '30% - 75%: 1/16-Takt Beat-Chopper zerhackt Deck A synchron zum Master-Tempo.',
        '75% - 100%: Stutter stoppt, Deck B startet mit voller Wucht.',
      ],
      bestFor: 'Electro, Dubstep, Bass Music, Glitch Hop, Live Remixing.',
      dspActions: ['Synchronized Square-wave Gating', 'Stereo Chopper Envelope', 'Frequency Split'],
    },
    curves: [
      { timeRatio: 0.0, deckAGain: 1.0, deckBGain: 0.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
      { timeRatio: 0.3, deckAGain: 0.9, deckBGain: 0.3, deckALow: -4, deckBLow: 0, deckAFilter: 10, deckBFilter: 0, fxIntensity: 0.4 },
      { timeRatio: 0.6, deckAGain: 0.7, deckBGain: 0.75, deckALow: -18, deckBLow: 0, deckAFilter: 30, deckBFilter: 0, fxIntensity: 0.85 },
      { timeRatio: 0.85, deckAGain: 0.2, deckBGain: 0.95, deckALow: -24, deckBLow: 0, deckAFilter: 50, deckBFilter: 0, fxIntensity: 0.9 },
      { timeRatio: 1.0, deckAGain: 0.0, deckBGain: 1.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
    ],
  },
  {
    id: 'vocal-mashup',
    name: 'Vocal Isolation & Mashup',
    germanName: 'Vocal-Isolation & Mashup Übergang',
    description: 'Isolates voice from incoming track, blends on top of active beat, then transitions cleanly.',
    iconName: 'Sparkles',
    defaultDurationBars: 8,
    category: 'Mashup',
    explanation: {
      howItWorks:
        'Ideal um Acapellas oder Gesangselemente auf einen laufenden Beat zu legen: Das Ziel-Deck filtert automatisch Bass und tiefe Frequenzen weg, isoliert das Stimm-Spektrum und schiebt sich harmonisch über den Beat.',
      stepByStep: [
        '0% - 40%: Vocals von Deck B werden isoliert und beat-synchron über den Beat von Deck A gelegt.',
        '40% - 70%: Beide Elemente spielen zusammen als spontanes Live-Mashup.',
        '70% - 100%: Bass von Deck B schaltet ein, Deck A fadet weich aus.',
      ],
      bestFor: 'Live Mashups, Vocal House, Pop Remixe, Hip-Hop Transitionen.',
      dspActions: ['Vocal Bandpass Filter', 'Bass Damping & Crossover', 'Beat-Sync Harmonic Lock'],
    },
    curves: [
      { timeRatio: 0.0, deckAGain: 1.0, deckBGain: 0.0, deckALow: 0, deckBLow: -24, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.2 },
      { timeRatio: 0.3, deckAGain: 1.0, deckBGain: 0.8, deckALow: 0, deckBLow: -24, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.6 },
      { timeRatio: 0.6, deckAGain: 0.8, deckBGain: 0.9, deckALow: 0, deckBLow: -12, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.8 },
      { timeRatio: 0.85, deckAGain: 0.3, deckBGain: 1.0, deckALow: -24, deckBLow: 0, deckAFilter: 20, deckBFilter: 0, fxIntensity: 0.3 },
      { timeRatio: 1.0, deckAGain: 0.0, deckBGain: 1.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
    ],
  },
  {
    id: 'beat-inject',
    name: '3rd Track Beat Add',
    germanName: 'Beat aus 3. Song hinzufügen',
    description: 'Injects punchy rhythm/drums from a 3rd song or deck while keeping melody & vocals.',
    iconName: 'Zap',
    defaultDurationBars: 4,
    category: 'Mashup',
    explanation: {
      howItWorks:
        'Schneidet den Bass des ersten Tracks gezielt an, während die Drums und Kicks des hinzugefügten Tracks nahtlos rhythmisch einsteigen. So entsteht eine neue dynamische Kombination aus zwei Songs.',
      stepByStep: [
        '0% - 25%: Beat wird beat-gematcht und fadet synchron ein.',
        '25% - 75%: Kick und Percussion treiben die Melodie / Vocals an.',
        '75% - 100%: Volle Bass-Integration und dynamischer Peak.',
      ],
      bestFor: 'Remix-Builds, Drum & Bass / House Layering, Drop Enhancements.',
      dspActions: ['Transient Punch Filter', 'Low-End Ducking', 'Stereo Percussion Boost'],
    },
    curves: [
      { timeRatio: 0.0, deckAGain: 1.0, deckBGain: 0.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
      { timeRatio: 0.3, deckAGain: 0.9, deckBGain: 0.6, deckALow: -6, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.5 },
      { timeRatio: 0.7, deckAGain: 0.6, deckBGain: 0.9, deckALow: -18, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0.7 },
      { timeRatio: 1.0, deckAGain: 0.0, deckBGain: 1.0, deckALow: 0, deckBLow: 0, deckAFilter: 0, deckBFilter: 0, fxIntensity: 0 },
    ],
  },
];

export const DEFAULT_EFFECTS: EffectSetting[] = [
  {
    id: 'echo',
    name: 'Tape Echo',
    category: 'time',
    enabled: false,
    target: 'A',
    wet: 0.5,
    param1: 0.35, // Time
    param2: 0.55, // Feedback
    param1Label: 'Time (1/4 - 1/16)',
    param2Label: 'Feedback',
  },
  {
    id: 'reverb',
    name: 'Space Reverb',
    category: 'time',
    enabled: false,
    target: 'A',
    wet: 0.4,
    param1: 0.7, // Room Size
    param2: 0.4, // Damping
    param1Label: 'Room Size',
    param2Label: 'Decay / Damp',
  },
  {
    id: 'flanger',
    name: 'Stereo Flanger',
    category: 'modulation',
    enabled: false,
    target: 'A',
    wet: 0.6,
    param1: 0.3, // Rate
    param2: 0.7, // Depth
    param1Label: 'LFO Rate',
    param2Label: 'Sweep Depth',
  },
  {
    id: 'phaser',
    name: 'Analog Phaser',
    category: 'modulation',
    enabled: false,
    target: 'A',
    wet: 0.5,
    param1: 0.4, // Rate
    param2: 0.6, // Feedback
    param1Label: 'Speed',
    param2Label: 'Color / Stages',
  },
  {
    id: 'lowpass',
    name: 'Resonant LPF',
    category: 'filter',
    enabled: false,
    target: 'A',
    wet: 1.0,
    param1: 0.8, // Cutoff
    param2: 0.3, // Res
    param1Label: 'Cutoff Freq',
    param2Label: 'Resonance (Q)',
  },
  {
    id: 'highpass',
    name: 'Resonant HPF',
    category: 'filter',
    enabled: false,
    target: 'A',
    wet: 1.0,
    param1: 0.1, // Cutoff
    param2: 0.4, // Res
    param1Label: 'Cutoff Freq',
    param2Label: 'Resonance (Q)',
  },
  {
    id: 'bandpass',
    name: 'Band-Pass Isolator',
    category: 'filter',
    enabled: false,
    target: 'A',
    wet: 1.0,
    param1: 0.5, // Center
    param2: 0.6, // Width
    param1Label: 'Center Freq',
    param2Label: 'Bandwidth (Q)',
  },
  {
    id: 'bitcrusher',
    name: '8-Bit Crusher',
    category: 'distortion',
    enabled: false,
    target: 'A',
    wet: 0.5,
    param1: 0.4, // Bit Depth
    param2: 0.6, // Sample Rate
    param1Label: 'Bit Depth',
    param2Label: 'Downsample',
  },
  {
    id: 'distortion',
    name: 'Club Overdrive',
    category: 'distortion',
    enabled: false,
    target: 'A',
    wet: 0.4,
    param1: 0.6, // Drive
    param2: 0.5, // Tone
    param1Label: 'Drive Gain',
    param2Label: 'Tone Color',
  },
  {
    id: 'gater',
    name: 'Beat Chopper',
    category: 'modulation',
    enabled: false,
    target: 'A',
    wet: 0.8,
    param1: 0.5, // Rate (1/8 vs 1/16)
    param2: 0.2, // Attack shape
    param1Label: 'Gate Slices',
    param2Label: 'Curve Sharpness',
  },
  {
    id: 'autopan',
    name: 'Rotary Auto-Pan',
    category: 'modulation',
    enabled: false,
    target: 'A',
    wet: 0.6,
    param1: 0.5, // Speed
    param2: 0.8, // Width
    param1Label: 'Pan Speed',
    param2Label: 'Stereo Spread',
  },
  {
    id: 'pitchshift',
    name: 'Harmonic Pitcher',
    category: 'modulation',
    enabled: false,
    target: 'A',
    wet: 1.0,
    param1: 0.5, // Semitones (-12 to +12)
    param2: 0.5, // Fine cent
    param1Label: 'Semitones',
    param2Label: 'Fine Tune',
  },
];

export const DEFAULT_SAMPLER_PADS: SamplePad[] = [
  { id: 0, name: '808 Kick', category: 'Drums', color: '#ef4444', keyTrigger: '1', volume: 0.9, pitch: 0, loop: false, isPlaying: false },
  { id: 1, name: 'Club Snare', category: 'Drums', color: '#f97316', keyTrigger: '2', volume: 0.85, pitch: 0, loop: false, isPlaying: false },
  { id: 2, name: 'Closed Hat', category: 'Drums', color: '#eab308', keyTrigger: '3', volume: 0.75, pitch: 0, loop: false, isPlaying: false },
  { id: 3, name: 'Open Hat', category: 'Drums', color: '#10b981', keyTrigger: '4', volume: 0.8, pitch: 0, loop: false, isPlaying: false },
  { id: 4, name: 'Air Horn', category: 'FX', color: '#06b6d4', keyTrigger: '5', volume: 0.85, pitch: 0, loop: false, isPlaying: false },
  { id: 5, name: 'Scratch FX', category: 'FX', color: '#3b82f6', keyTrigger: '6', volume: 0.85, pitch: 0, loop: false, isPlaying: false },
  { id: 6, name: 'Laser Zap', category: 'FX', color: '#8b5cf6', keyTrigger: '7', volume: 0.8, pitch: 0, loop: false, isPlaying: false },
  { id: 7, name: 'Vox Drop', category: 'Vocal', color: '#ec4899', keyTrigger: '8', volume: 0.9, pitch: 0, loop: false, isPlaying: false },
];
