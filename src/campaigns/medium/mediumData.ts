import { RadioObjectId, Scene3DObjectPreset } from '../../three/radioStationBuilder';
import { GenericEvidenceCard } from '../../shared/components/GenericEvidenceBoardModal';

export type MediumInventoryId = 'copper_jumper' | 'morse_reference_card' | 'carrier_relay_fuse';

export type MediumEvidenceId =
  | 'ev_m_blueprint'
  | 'ev_m_recorder'
  | 'ev_m_breaker'
  | 'ev_m_cabinet'
  | 'ev_m_headphones'
  | 'ev_m_transmitter'
  | 'ev_m_oscilloscope'
  | 'ev_m_door_seal';

export interface MediumObjectMeta extends Scene3DObjectPreset {
  id: RadioObjectId;
  subtitle: string;
  description: string;
  clueTitle: string;
  clueText: string;
  evidenceId?: MediumEvidenceId;
}

export const MEDIUM_CIRCUIT_TARGET: Record<string, string> = {
  'PWR-A': 'RELAY-C1',
  'COIL-B2': 'AMP-D3',
  'GND-G4': 'SHIELD-E2',
};

export const MEDIUM_MORSE_TOKENS = ['---..', '---..', '.-.-.-', '....-']; // Decodes strictly to 88.4
export const MEDIUM_TARGET_FREQUENCY = 88.4;

export const MEDIUM_PUZZLE_HINTS: Record<1 | 2 | 3, [string, string]> = {
  1: [
    'Compare the Wiring Diagram on the back wall with the engineer notes in the Audio Recorder.',
    'Trace which input rail feeds the Relay, which coil feeds the Amp Stage, and where Ground drains.',
  ],
  2: [
    'Listen carefully to the four pulsed groups in Slow Mode and compare dashes vs dots against the ITU table.',
    'The third pulse group represents a decimal point symbol separating the frequency band.',
  ],
  3: [
    'Make sure both the Circuit Board and Morse Broadcast are verified before locking the tuner.',
    'Sweep the analog dial slowly near the lower end of the FM band where clarity peaks.',
  ],
};

export const MEDIUM_INVENTORY_ITEMS: Record<
  MediumInventoryId,
  { id: MediumInventoryId; name: string; shortLabel: string; description: string; inspectNote: string }
> = {
  copper_jumper: {
    id: 'copper_jumper',
    name: 'Copper Relay Leads',
    shortLabel: 'Relay Leads',
    description: 'Braided heavy-gauge insulated copper leads recovered from the 1998 cabinet.',
    inspectNote: 'Rated for high-voltage basement transmitter buses on the Circuit Board.',
  },
  morse_reference_card: {
    id: 'morse_reference_card',
    name: 'Laminated ITU Morse Key',
    shortLabel: 'Morse Card',
    description: 'Standard numeric Morse decoding chart ejected when transmitter power restored.',
    inspectNote: 'Use this chart alongside the Oscilloscope pulses to decode the carrier value.',
  },
  carrier_relay_fuse: {
    id: 'carrier_relay_fuse',
    name: 'Solenoid Carrier Fuse',
    shortLabel: 'Carrier Fuse',
    description: 'High-Q quartz fuse unlocked after authenticating the phantom Morse signal.',
    inspectNote: 'Required on the Frequency Dial console to unlatch the basement exit door.',
  },
};

export const MEDIUM_EVIDENCE_ITEMS: Record<MediumEvidenceId, GenericEvidenceCard> = {
  ev_m_blueprint: {
    id: 'ev_m_blueprint',
    title: '1998 TX Relay Schematic',
    objectId: 'wiring_diagram',
    objectLabel: 'Wiring Diagram',
    stage: 1,
    shortDescription: 'Laminated wiring chart pinned above the analog tuner console.',
    detailNote:
      'Relay Spec: Mains PWR-A bridges to RELAY-C1; RF Coil B2 connects to AMP-D3; Ground G4 drains to SHIELD-E2.',
    markerSymbol: 'SCHEM',
  },
  ev_m_recorder: {
    id: 'ev_m_recorder',
    title: 'Engineer Tape Warning',
    objectId: 'audio_recorder',
    objectLabel: 'Audio Recorder',
    stage: 1,
    shortDescription: 'Reel-to-reel maintenance voice memo left by senior tech.',
    detailNote:
      '"Never cross Mains into Shield Drain! Check the wall schematic before energizing the rack."',
    markerSymbol: 'REEL',
  },
  ev_m_breaker: {
    id: 'ev_m_breaker',
    title: 'Emergency Bulkhead Trip Log',
    objectId: 'emergency_light',
    objectLabel: 'Emergency Light',
    stage: 1,
    shortDescription: 'Reset tag wired beneath the rotating crimson bunker light.',
    detailNote: 'Circuit interlocks trip unless all three jumper bridges match the 1998 schematic.',
    markerSymbol: 'BREAKER',
  },
  ev_m_cabinet: {
    id: 'ev_m_cabinet',
    title: '1998 Broadcast Logbook',
    objectId: 'filing_cabinet',
    objectLabel: 'Filing Cabinet',
    stage: 2,
    shortDescription: 'Dusty station log recovered inside the grey steel cabinet.',
    detailNote:
      '"Midnight broadcasts operate exclusively on a 4-character numeric FM band (XX.X)."',
    markerSymbol: 'LOG 98',
  },
  ev_m_headphones: {
    id: 'ev_m_headphones',
    title: 'Monitor Headset Tape Note',
    objectId: 'headphones',
    objectLabel: 'Headphones',
    stage: 2,
    shortDescription: 'Scratched masking-tape label across the left brass earcup.',
    detailNote: '"When the oscilloscope loops 4 burst groups, slow the cadence to count dots & dashes."',
    markerSymbol: 'AUDIO',
  },
  ev_m_transmitter: {
    id: 'ev_m_transmitter',
    title: 'TX Carrier Plate Spec',
    objectId: 'transmitter_rack',
    objectLabel: 'Transmitter Rack',
    stage: 2,
    shortDescription: 'Riveted brass specification tag on the main vacuum-tube chassis.',
    detailNote: 'Power-on enables automated loop playback of the encoded carrier ID on the CRT.',
    markerSymbol: 'TX-RF',
  },
  ev_m_oscilloscope: {
    id: 'ev_m_oscilloscope',
    title: 'CRT Signal Pulse Trace',
    objectId: 'oscilloscope',
    objectLabel: 'Oscilloscope',
    stage: 3,
    shortDescription: 'Phosphor green trace pulsing a steady four-token numeric Morse burst.',
    detailNote: 'Decode all four burst tokens cleanly before touching the Frequency Dial.',
    markerSymbol: 'CRT',
  },
  ev_m_door_seal: {
    id: 'ev_m_door_seal',
    title: 'Solenoid Release Placard',
    objectId: 'transmission_door',
    objectLabel: 'Transmission Door',
    stage: 3,
    shortDescription: 'Steel warning stencil beside the stairwell exit bulkhead.',
    detailNote:
      '"Door unlatches only when active RF Frequency Console matches verified carrier lock."',
    markerSymbol: 'SOLENOID',
  },
};

export const MEDIUM_EVIDENCE_ORDER: MediumEvidenceId[] = [
  'ev_m_blueprint',
  'ev_m_recorder',
  'ev_m_breaker',
  'ev_m_cabinet',
  'ev_m_headphones',
  'ev_m_transmitter',
  'ev_m_oscilloscope',
  'ev_m_door_seal',
];

export const MEDIUM_PAIR_DESCRIPTIONS: Record<string, string> = {
  'ev_m_blueprint|ev_m_recorder': 'Schematic wire routing verified against engineer voice tape',
  'ev_m_breaker|ev_m_blueprint': 'Correct 3-rail jumper mapping stops breaker trip',
  'ev_m_headphones|ev_m_oscilloscope': 'Use slow playback on the CRT pulses to decode Morse tokens',
  'ev_m_cabinet|ev_m_oscilloscope': 'Decoded 4-token FM value matches XX.X format in 1998 logbook',
  'ev_m_door_seal|ev_m_oscilloscope': 'Decoded FM carrier frequency arms the solenoid exit lock',
};

export const MEDIUM_OBJECTS: Record<RadioObjectId, MediumObjectMeta> = {
  transmitter_rack: {
    id: 'transmitter_rack',
    name: 'Transmitter Rack',
    subtitle: 'Vacuum-Tube RF Mainframe',
    description:
      'A towering matte-black radio rack packed with glass valves and amber VU needles. Its main power breaker sits dead.',
    clueTitle: 'RF Chassis Diagnostics',
    clueText:
      'Once the Circuit Board bridges Mains, RF Coil, and Ground properly, this rack powers the Oscilloscope signal.',
    evidenceId: 'ev_m_transmitter',
    cameraPosition: [-1.15, 1.48, -0.55],
    cameraTarget: [-2.45, 1.32, -2.0],
    hotspotAnchor: [-2.45, 1.5, -1.85],
  },
  circuit_board: {
    id: 'circuit_board',
    name: 'Circuit Board',
    subtitle: 'Lock 1 · Exposed Relay Busbar',
    description:
      'An open green PCB junction panel mounted to the damp basement wall with three disconnected input leads.',
    clueTitle: 'Relay Connection Required',
    clueText:
      'Connect PWR-A, COIL-B2, and GND-G4 to their matching sockets per the Wiring Diagram.',
    cameraPosition: [-1.55, 1.55, -1.15],
    cameraTarget: [-2.95, 1.55, -1.15],
    hotspotAnchor: [-2.85, 1.58, -1.15],
  },
  oscilloscope: {
    id: 'oscilloscope',
    name: 'Oscilloscope',
    subtitle: 'Lock 2 · Green CRT Morse Trace',
    description:
      'A heavy benchtop phosphor CRT monitor wired directly into the transmitter telemetry output.',
    clueTitle: 'Phantom Morse Broadcast',
    clueText:
      'Displays visual square-wave pulses and plays audible Morse code once Lock 1 restores transmitter power.',
    evidenceId: 'ev_m_oscilloscope',
    cameraPosition: [-1.45, 1.45, -0.75],
    cameraTarget: [-1.55, 1.18, -1.95],
    hotspotAnchor: [-1.55, 1.35, -1.85],
  },
  frequency_dial: {
    id: 'frequency_dial',
    name: 'Frequency Dial',
    subtitle: 'Lock 3 · Analog Rotary FM Console',
    description:
      'Brushed aluminum radio receiver spanning 87.5 to 108.0 MHz with a heavy vernier flywheel and static meter.',
    clueTitle: 'Carrier Lock Control',
    clueText:
      'Requires Puzzles 1 & 2 cleared. Tune cleanly to the decoded FM frequency to release the bulkhead door.',
    cameraPosition: [-0.62, 1.38, -0.72],
    cameraTarget: [-0.62, 1.12, -1.88],
    hotspotAnchor: [-0.62, 1.3, -1.82],
  },
  audio_recorder: {
    id: 'audio_recorder',
    name: 'Audio Recorder',
    subtitle: 'Reel-to-Reel Maintenance Deck',
    description:
      'A twin-reel magnetic tape unit spinning slowly on the right side of the console.',
    clueTitle: 'Technician Memo Transcript',
    clueText:
      '"Remember: cross-wiring Mains into Shield Drain fries the breaker. Check the schematic!"',
    evidenceId: 'ev_m_recorder',
    cameraPosition: [0.38, 1.42, -0.78],
    cameraTarget: [0.38, 1.05, -2.02],
    hotspotAnchor: [0.38, 1.25, -1.95],
  },
  headphones: {
    id: 'headphones',
    name: 'Headphones',
    subtitle: 'Studio Monitor Headset',
    description:
      'Heavy padded studio cans left beside the tape deck with hand-scratched tape along the headband.',
    clueTitle: 'Operator Margin Note',
    clueText:
      '"If the phantom Morse burst runs too fast, drop the CRT to Slow Mode and count each dot/dash."',
    evidenceId: 'ev_m_headphones',
    cameraPosition: [0.55, 1.32, -0.58],
    cameraTarget: [0.52, 0.99, -1.68],
    hotspotAnchor: [0.52, 1.12, -1.68],
  },
  wiring_diagram: {
    id: 'wiring_diagram',
    name: 'Wiring Diagram',
    subtitle: 'Back-Wall Relay Blueprint',
    description:
      'A cyan blueprint sheet bolted directly above the analog tuner console.',
    clueTitle: 'Exact Relay Topology',
    clueText:
      'Reads clearly: PWR-A → RELAY-C1 | COIL-B2 → AMP-D3 | GND-G4 → SHIELD-E2.',
    evidenceId: 'ev_m_blueprint',
    cameraPosition: [-0.55, 1.88, -1.05],
    cameraTarget: [-0.55, 1.92, -2.65],
    hotspotAnchor: [-0.55, 1.92, -2.55],
  },
  filing_cabinet: {
    id: 'filing_cabinet',
    name: 'Filing Cabinet',
    subtitle: '1998 Station Log & Parts',
    description:
      'A dented steel filing cabinet labeled "STUDENT RADIO SOC · BASEMENT B1".',
    clueTitle: 'Archived Broadcast Format',
    clueText:
      'Logbook notes FM emergency broadcasts always use 4-character XX.X numeric bands. Copper leads sit inside.',
    evidenceId: 'ev_m_cabinet',
    cameraPosition: [1.55, 1.35, -0.85],
    cameraTarget: [2.25, 0.9, -2.15],
    hotspotAnchor: [2.25, 1.25, -2.05],
  },
  emergency_light: {
    id: 'emergency_light',
    name: 'Emergency Light',
    subtitle: 'Red Bulkhead Beacon & Breaker',
    description:
      'A caged crimson strobe light casting pulsing shadows across the damp brick walls.',
    clueTitle: 'Power Surge Readout',
    clueText:
      'Inspection placard confirms breaker resets automatically when the three circuit pairs match the diagram.',
    evidenceId: 'ev_m_breaker',
    cameraPosition: [1.35, 1.85, 0.35],
    cameraTarget: [2.85, 2.02, 0.35],
    hotspotAnchor: [2.75, 2.02, 0.35],
  },
  transmission_door: {
    id: 'transmission_door',
    name: 'Transmission Door',
    subtitle: 'Steel Stairwell Bulkhead Exit',
    description:
      'An airtight riveted steel door sealing Sub-Level 1. Solenoid bolts glow crimson until locked carrier is verified.',
    clueTitle: 'Exit Solenoid Status',
    clueText:
      'Unlocks only when the Analog Frequency Dial settles cleanly onto the decoded carrier band.',
    evidenceId: 'ev_m_door_seal',
    cameraPosition: [0.45, 1.42, 1.05],
    cameraTarget: [0.55, 1.25, 2.8],
    hotspotAnchor: [0.55, 1.35, 2.65],
  },
};

export const MEDIUM_OBJECT_ORDER: RadioObjectId[] = [
  'wiring_diagram',
  'circuit_board',
  'transmitter_rack',
  'oscilloscope',
  'audio_recorder',
  'headphones',
  'filing_cabinet',
  'emergency_light',
  'frequency_dial',
  'transmission_door',
];

export const ITU_MORSE_DIGIT_CHART: Array<{ char: string; code: string }> = [
  { char: '0', code: '-----' },
  { char: '1', code: '.----' },
  { char: '2', code: '..---' },
  { char: '3', code: '...--' },
  { char: '4', code: '....-' },
  { char: '5', code: '.....' },
  { char: '6', code: '-....' },
  { char: '7', code: '--...' },
  { char: '8', code: '---..' },
  { char: '9', code: '----.' },
  { char: '.', code: '.-.-.-' },
];

export function validateMediumCircuitConnections(connections: Record<string, string>): boolean {
  return Object.entries(MEDIUM_CIRCUIT_TARGET).every(
    ([src, dst]) => connections[src] === dst
  );
}

export function validateMediumMorseDecode(input: string, circuitSolved: boolean): boolean {
  if (!circuitSolved) return false;
  return input.trim() === '88.4';
}

export function validateMediumFrequency(
  freqMhz: number,
  circuitSolved: boolean,
  morseSolved: boolean
): boolean {
  if (!circuitSolved || !morseSolved) return false;
  return Math.abs(freqMhz - MEDIUM_TARGET_FREQUENCY) < 0.05;
}
