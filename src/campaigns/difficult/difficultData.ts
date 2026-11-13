import { ArchiveObjectId } from '../../three/archiveRoomBuilder';
import { Scene3DObjectPreset } from '../../three/radioStationBuilder';
import { GenericEvidenceCard } from '../../shared/components/GenericEvidenceBoardModal';

export type DifficultInventoryId = 'caesar_rule_plate' | 'warden_ledger_seal' | 'vault_crank_key';

export type DifficultEvidenceId =
  | 'ev_d_dossier'
  | 'ev_d_alcove'
  | 'ev_d_photos'
  | 'ev_d_shelves'
  | 'ev_d_blueprints'
  | 'ev_d_cabinets'
  | 'ev_d_witnesses'
  | 'ev_d_vault_spec';

export type CompassBearing =
  | 'NORTH'
  | 'NORTHEAST'
  | 'EAST'
  | 'SOUTHEAST'
  | 'SOUTH'
  | 'SOUTHWEST'
  | 'WEST'
  | 'NORTHWEST';

export const COMPASS_BEARINGS: CompassBearing[] = [
  'NORTH',
  'NORTHEAST',
  'EAST',
  'SOUTHEAST',
  'SOUTH',
  'SOUTHWEST',
  'WEST',
  'NORTHWEST',
];

export interface DifficultObjectMeta extends Scene3DObjectPreset {
  id: ArchiveObjectId;
  subtitle: string;
  description: string;
  clueTitle: string;
  clueText: string;
  evidenceId?: DifficultEvidenceId;
}

export const DIFFICULT_CIPHER_TEXT = 'QRUWK';
export const DIFFICULT_CIPHER_TARGET = 'NORTH';
export const DIFFICULT_TIMELINE_TARGET = ['4', '1', '7', '2'];

export interface WitnessRecordItem {
  id: '4' | '1' | '7' | '2';
  name: string;
  role: string;
  statement: string;
  contradictionNote: string;
}

export const WITNESS_RECORDS_DATA: WitnessRecordItem[] = [
  {
    id: '1',
    name: 'Witness #1 · Gatekeeper Das',
    role: 'Main South Gate Register',
    statement:
      '"I signed the heavy brass trunk into Sub-Level 1 right after the hostel lights flickered out."',
    contradictionNote: 'Gate ink blot timestamp places trunk entry 15 minutes AFTER power cut.',
  },
  {
    id: '2',
    name: 'Witness #2 · Senior Arvind',
    role: 'Block C 3rd Floor Resident',
    statement:
      '"Everything was sealed upstairs before I stepped away from Room 307 just before midnight."',
    contradictionNote: 'Final log marks Room 307 keyed shut 15 minutes AFTER emergency radio burst.',
  },
  {
    id: '4',
    name: 'Witness #4 · Electrician Menon',
    role: 'Basement Junction Crew',
    statement:
      '"I pulled the Block C feeder breaker at 11:05 PM so the vault relay wouldn’t trip."',
    contradictionNote: 'Fuse log confirms this was the very FIRST incident of the 1994 sweep.',
  },
  {
    id: '7',
    name: 'Witness #7 · Operator Nair',
    role: 'Station 88.4 Night Tech',
    statement:
      '"I keyed the 88.4 Morse distress loop once the trunk reached Sub-Level 1."',
    contradictionNote: 'Broadcast reel matches 15 minutes AFTER Gatekeeper entry, before Room 307.',
  },
];

export const DIFFICULT_PUZZLE_HINTS: Record<1 | 2 | 3, [string, string]> = {
  1: [
    'Examine the Historical Documents for the encrypted plaque, then open the Hidden Compartment on the right wall for the shift direction.',
    'Shift each cipher letter 3 positions backward on the Brass Cipher Wheel to form a compass direction.',
  ],
  2: [
    'Cross-check the four Witness Records against the Archive Shelves ledger timestamps to discard false claims.',
    'Order the witness badge numbers strictly from earliest event (power cut) to latest event (Room 307 lockdown).',
  ],
  3: [
    'The Mechanical Vault combines both prior locks: its outer compass ring uses Lock 1 and its 4 digit drums use Lock 2.',
    'Align the vault outer bearing to the decoded direction first, then dial the chronological witness sequence.',
  ],
};

export const DIFFICULT_INVENTORY_ITEMS: Record<
  DifficultInventoryId,
  { id: DifficultInventoryId; name: string; shortLabel: string; description: string; inspectNote: string }
> = {
  caesar_rule_plate: {
    id: 'caesar_rule_plate',
    name: 'Brass Shift Plaque (-3)',
    shortLabel: 'Shift Plate',
    description: 'Etched brass rule recovered from the stone alcove behind the right wall.',
    inspectNote: 'Instructs: Rotate cipher alphabet 3 steps backward (D → A).',
  },
  warden_ledger_seal: {
    id: 'warden_ledger_seal',
    name: "Warden's Archive Seal",
    shortLabel: 'Archive Seal',
    description: 'Wax-stamped wax key unlocked when the Archive Cipher resolves.',
    inspectNote: 'Unseals the four Witness Record testimony folders on the investigation desk.',
  },
  vault_crank_key: {
    id: 'vault_crank_key',
    name: 'Vault Engagement Key',
    shortLabel: 'Vault Crank',
    description: 'Heavy iron spline crank unlocked after verifying the 1994 timeline.',
    inspectNote: 'Required on the Mechanical Vault alongside Compass Bearing + 4 Digit Rings.',
  },
};

export const DIFFICULT_EVIDENCE_ITEMS: Record<DifficultEvidenceId, GenericEvidenceCard> = {
  ev_d_dossier: {
    id: 'ev_d_dossier',
    title: 'Stamped Cipher Directive',
    objectId: 'historical_documents',
    objectLabel: 'Historical Documents',
    stage: 1,
    shortDescription: 'Wax-sealed order sheet resting beside the green banker lamp.',
    detailNote:
      'Bearing Code reads "QRUWK". Footnote references a stone niche on the eastern wall.',
    markerSymbol: 'QRUWK',
  },
  ev_d_alcove: {
    id: 'ev_d_alcove',
    title: 'Stone Alcove Shift Rule',
    objectId: 'hidden_compartments',
    objectLabel: 'Hidden Compartments',
    stage: 1,
    shortDescription: 'Chiseled brass rule hidden behind a loose masonry block.',
    detailNote: '"WARDEN PROTOCOL: Shift cipher characters 3 steps BACKWARD (-3) to reveal true bearing."',
    markerSymbol: 'SHIFT -3',
  },
  ev_d_photos: {
    id: 'ev_d_photos',
    title: '1994 Foundation Photo Board',
    objectId: 'old_photographs',
    objectLabel: 'Old Photographs',
    stage: 2,
    shortDescription: 'Sepia prints showing the Electrician, Gatekeeper, Radio Tech, and Senior.',
    detailNote: 'Handwritten backs note the blackout began at the main breaker before any door sealed.',
    markerSymbol: '1994',
  },
  ev_d_shelves: {
    id: 'ev_d_shelves',
    title: 'Archive Time Ledger',
    objectId: 'archive_shelves',
    objectLabel: 'Archive Shelves',
    stage: 2,
    shortDescription: 'Leather-bound hostel night log matching Block C blackout intervals.',
    detailNote:
      'True order: 1) Breaker power cut → 2) Gate trunk signed → 3) Radio distress → 4) Room 307 sealed.',
    markerSymbol: 'LEDGER',
  },
  ev_d_blueprints: {
    id: 'ev_d_blueprints',
    title: 'Sub-Archive Vault Blueprint',
    objectId: 'architectural_plans',
    objectLabel: 'Architectural Plans',
    stage: 3,
    shortDescription: 'Original 1994 cyan structural drawing of Vault B.',
    detailNote:
      'Shows Vault B requires dual calibration: Outer Bearing Ring (Lock 1) + 4-Drum Witness Pin (Lock 2).',
    markerSymbol: 'PLAN',
  },
  ev_d_cabinets: {
    id: 'ev_d_cabinets',
    title: 'Locked Cabinet Index Tag',
    objectId: 'document_cabinets',
    objectLabel: 'Document Cabinets',
    stage: 2,
    shortDescription: 'Brass inventory card wedged in the top archival drawer.',
    detailNote: 'Cross-references Witnesses #1, #2, #4, #7 as the sole four personnel on duty that night.',
    markerSymbol: 'INDEX',
  },
  ev_d_witnesses: {
    id: 'ev_d_witnesses',
    title: 'Four Contradictory Statements',
    objectId: 'witness_records',
    objectLabel: 'Witness Records',
    stage: 2,
    shortDescription: 'Four numbered folders collected on the mahogany investigation desk.',
    detailNote:
      'Comparing their times against the Archive Ledger isolates a strict 4-digit witness ID order.',
    markerSymbol: '4 FILES',
  },
  ev_d_vault_spec: {
    id: 'ev_d_vault_spec',
    title: 'Vault Calibration Plate',
    objectId: 'mechanical_vault',
    objectLabel: 'Mechanical Vault',
    stage: 3,
    shortDescription: 'Engraved bronze plate beside the massive iron flywheel.',
    detailNote:
      '"Lock collapses only when Compass Ring matches decoded Archive Cipher AND 4 drums match Witness Timeline."',
    markerSymbol: 'VAULT B',
  },
};

export const DIFFICULT_EVIDENCE_ORDER: DifficultEvidenceId[] = [
  'ev_d_dossier',
  'ev_d_alcove',
  'ev_d_photos',
  'ev_d_shelves',
  'ev_d_cabinets',
  'ev_d_witnesses',
  'ev_d_blueprints',
  'ev_d_vault_spec',
];

export const DIFFICULT_PAIR_DESCRIPTIONS: Record<string, string> = {
  'ev_d_alcove|ev_d_dossier': 'Apply Shift -3 backward to QRUWK on the Brass Cipher Wheel',
  'ev_d_shelves|ev_d_witnesses': 'Archive ledger intervals sort the 4 witness IDs earliest to latest',
  'ev_d_photos|ev_d_witnesses': '1994 staff roles corroborate blackout -> trunk -> broadcast -> 307',
  'ev_d_blueprints|ev_d_vault_spec': 'Vault B requires both Compass Bearing and 4-Drum Witness Pin',
};

export const DIFFICULT_OBJECTS: Record<ArchiveObjectId, DifficultObjectMeta> = {
  archive_shelves: {
    id: 'archive_shelves',
    name: 'Archive Shelves',
    subtitle: 'Bound 1994 Hostel Ledgers',
    description:
      'Towering dark-oak archival shelving stacked with leather-bound curfew and power registers.',
    clueTitle: 'Night Duty Time Ledger',
    clueText:
      '11:05 PM Feeder cut → 11:20 PM Trunk Gate Entry → 11:35 PM Radio Burst → 11:50 PM Room 307 Locked.',
    evidenceId: 'ev_d_shelves',
    cameraPosition: [-1.15, 1.48, -0.75],
    cameraTarget: [-2.05, 1.35, -2.35],
    hotspotAnchor: [-2.05, 1.55, -2.25],
  },
  document_cabinets: {
    id: 'document_cabinets',
    name: 'Document Cabinets',
    subtitle: 'Iron Drawer Bank',
    description:
      'Heavy riveted archival cabinets engraved with brass index tags along the back-right wall.',
    clueTitle: '1994 Duty Roster Index',
    clueText:
      'Lists only four individuals present during the lockdown: #1 Das, #2 Arvind, #4 Menon, #7 Nair.',
    evidenceId: 'ev_d_cabinets',
    cameraPosition: [1.35, 1.35, -0.85],
    cameraTarget: [2.05, 0.85, -2.28],
    hotspotAnchor: [2.05, 1.15, -2.18],
  },
  old_photographs: {
    id: 'old_photographs',
    name: 'Old Photographs',
    subtitle: '1994 Staff & Construction Prints',
    description:
      'Mounted sepia photographs pinned to felt board along the masonry left wall.',
    clueTitle: 'Sub-Level Photograph Notes',
    clueText:
      'Confirms the power outage triggered the trunk relocation before anyone transmitted on 88.4.',
    evidenceId: 'ev_d_photos',
    cameraPosition: [-1.55, 1.65, -0.55],
    cameraTarget: [-3.08, 1.72, -0.55],
    hotspotAnchor: [-2.95, 1.72, -0.55],
  },
  historical_documents: {
    id: 'historical_documents',
    name: 'Historical Documents',
    subtitle: 'Encrypted Warden Directive',
    description:
      'A heavy wax-stamped parchment folder opened beside the warm green banker lamp.',
    clueTitle: 'Cipher Plaque: "QRUWK"',
    clueText:
      'Stamped across the top seal: "TRUE BEARING: QRUWK". Requires the shift rule from the Hidden Compartment.',
    evidenceId: 'ev_d_dossier',
    cameraPosition: [-0.48, 1.42, 0.45],
    cameraTarget: [-0.48, 0.9, -0.25],
    hotspotAnchor: [-0.48, 1.08, -0.25],
  },
  investigation_desk: {
    id: 'investigation_desk',
    name: 'Investigation Desk',
    subtitle: 'Mahogany Archivist Table',
    description:
      'A broad mahogany table lit by an antique brass banker lamp, holding dossiers, witness files, and tools.',
    clueTitle: 'Archivist Summary Note',
    clueText:
      'Step 1: Break Cipher on Wheel · Step 2: Order Witness Records · Step 3: Calibrate Mechanical Vault.',
    cameraPosition: [-0.2, 1.48, 0.72],
    cameraTarget: [-0.2, 0.88, -0.35],
    hotspotAnchor: [-0.2, 0.98, -0.35],
  },
  cipher_wheel: {
    id: 'cipher_wheel',
    name: 'Cipher Wheel',
    subtitle: 'Lock 1 · Concentric Brass Caesar Disc',
    description:
      'A precision two-ring engraved brass disc resting on velvet beside the historical dossier.',
    clueTitle: 'Caesar Rotation Lock (Lock 1)',
    clueText:
      'Rotate the inner ring to apply the shift rule (-3 backward) to "QRUWK" and submit the decoded direction.',
    cameraPosition: [0.25, 1.38, 0.48],
    cameraTarget: [0.25, 0.9, -0.18],
    hotspotAnchor: [0.25, 1.08, -0.18],
  },
  witness_records: {
    id: 'witness_records',
    name: 'Witness Records',
    subtitle: 'Lock 2 · Four Numbered Testimonies',
    description:
      'Four sealed brown archival folders marked #1, #2, #4, and #7 stacked neatly on the desk.',
    clueTitle: 'Chronological Deduction (Lock 2)',
    clueText:
      'Compare all four statements against the Archive Ledger to order the witness IDs earliest to latest.',
    evidenceId: 'ev_d_witnesses',
    cameraPosition: [0.35, 1.42, 0.25],
    cameraTarget: [0.28, 0.92, -0.58],
    hotspotAnchor: [0.28, 1.12, -0.58],
  },
  architectural_plans: {
    id: 'architectural_plans',
    name: 'Architectural Plans',
    subtitle: '1994 Sub-Basement Vault Blueprint',
    description:
      'Original cyan engineering plans showing Room 307’s shaft descending past Station 88.4 into Vault B.',
    clueTitle: 'Dual-Lock Architecture',
    clueText:
      'Vault B’s outer ring encodes Compass Bearing; its 4 inner brass drums encode the 4-digit Timeline Key.',
    evidenceId: 'ev_d_blueprints',
    cameraPosition: [0.1, 1.75, -0.95],
    cameraTarget: [0.1, 1.82, -2.7],
    hotspotAnchor: [0.1, 1.82, -2.58],
  },
  hidden_compartments: {
    id: 'hidden_compartments',
    name: 'Hidden Compartments',
    subtitle: 'Loose Masonry Alcove',
    description:
      'A hollow stone block along the right archive wall masking a recessed brass plaque.',
    clueTitle: 'Shift Key Discovered',
    clueText:
      'Engraved plate specifies exact Caesar offset: SHIFT 3 PLACES BACKWARD (-3).',
    evidenceId: 'ev_d_alcove',
    cameraPosition: [1.55, 1.42, -0.25],
    cameraTarget: [2.98, 1.38, -0.28],
    hotspotAnchor: [2.85, 1.38, -0.28],
  },
  mechanical_vault: {
    id: 'mechanical_vault',
    name: 'Mechanical Vault',
    subtitle: 'Lock 3 · Dual-Ring Sub-Archive Exit',
    description:
      'A monumental riveted iron vault door with rotating brass compass ring and four numbered digit drums.',
    clueTitle: 'Final Vault Calibration (Lock 3)',
    clueText:
      'Requires Lock 1 Bearing AND Lock 2 Chronological 4-Digit Sequence to retract the main iron bolts.',
    evidenceId: 'ev_d_vault_spec',
    cameraPosition: [0.3, 1.38, 1.1],
    cameraTarget: [0.3, 1.25, 2.82],
    hotspotAnchor: [0.3, 1.32, 2.65],
  },
};

export const DIFFICULT_OBJECT_ORDER: ArchiveObjectId[] = [
  'historical_documents',
  'hidden_compartments',
  'cipher_wheel',
  'archive_shelves',
  'old_photographs',
  'document_cabinets',
  'witness_records',
  'architectural_plans',
  'investigation_desk',
  'mechanical_vault',
];

export function caesarDecodeWord(cipher: string, shift: number): string {
  const A = 'A'.charCodeAt(0);
  return cipher
    .toUpperCase()
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code < A || code > A + 25) return ch;
      const offset = (((code - A + shift) % 26) + 26) % 26;
      return String.fromCharCode(A + offset);
    })
    .join('');
}

export function validateDifficultCipher(decodedInput: string): boolean {
  return decodedInput.trim().toUpperCase() === DIFFICULT_CIPHER_TARGET;
}

export function validateDifficultTimeline(
  orderIds: string[],
  cipherSolved: boolean
): boolean {
  if (!cipherSolved || orderIds.length !== 4) return false;
  return orderIds.every((id, idx) => id === DIFFICULT_TIMELINE_TARGET[idx]);
}

export function validateDifficultVault(
  bearing: CompassBearing,
  digits: [number, number, number, number],
  cipherSolved: boolean,
  timelineSolved: boolean
): boolean {
  if (!cipherSolved || !timelineSolved) return false;
  if (bearing !== DIFFICULT_CIPHER_TARGET) return false;
  return digits.map(String).join('-') === DIFFICULT_TIMELINE_TARGET.join('-');
}
