import {
  BookItem,
  DirectionStep,
  EvidenceId,
  EvidenceItemMeta,
  InventoryItem,
  InventoryItemId,
  PhoneMessage,
  PhoneMissedCall,
  PhonePhotoMeta,
  PhoneVoicemail,
  PuzzleStage,
  RoomObjectId,
  RoomObjectMeta,
  VictoryClassification,
  WardenThreatState,
} from '../types/game';

export const GLOBAL_MAX_HINTS = 2;
export const STANDARD_DURATION_SECONDS = 480; // 08:00
export const DEMO_DURATION_SECONDS = 150; // 02:30 for judge demo

export const PUZZLE_1_SOLUTION = '427';
export const PUZZLE_2_BOOK_ORDER: Array<'A' | 'B' | 'C' | 'D'> = ['C', 'A', 'D', 'B']; // 2015 -> 2018 -> 2020 -> 2022
export const PUZZLE_2_CODE = '1368';
export const PUZZLE_3_SEQUENCE: DirectionStep[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

export const INTRO_LETTER_TEXT = `Dear Resident,

You have exactly one night to prove that you deserve this room.

Everything you need is hidden inside.

Three locks stand between you and freedom.

The warden is coming.

Choose carefully. Observe everything.

And remember...

Not every clue is what it seems.`;

export const CLIFFHANGER_DOOR_NOTE = `Congratulations. You escaped Room 307.

But did you ever figure out who locked it?

Check the sealed stairwell beneath Block C—an abandoned student radio station still hums past midnight.`;

export const BOOKS_DATA: BookItem[] = [
  {
    id: 'A',
    title: 'Discrete Structures',
    subject: 'CS-204 · Room Archive',
    year: 2018,
    digit: '3',
    color: '#9f3a2f',
  },
  {
    id: 'B',
    title: 'Systems Architecture',
    subject: 'CS-401 · Final Edition',
    year: 2022,
    digit: '8',
    color: '#2d5a7b',
  },
  {
    id: 'C',
    title: 'Applied Mechanics',
    subject: 'ME-102 · First Print',
    year: 2015,
    digit: '1',
    color: '#3f6a4e',
  },
  {
    id: 'D',
    title: 'Signal Processing',
    subject: 'EC-305 · Hostel Copy',
    year: 2020,
    digit: '6',
    color: '#8a6b2e',
  },
];

export const INVENTORY_ITEMS: Record<InventoryItemId, InventoryItem> = {
  brass_key: {
    id: 'brass_key',
    name: 'Brass Key',
    shortLabel: 'Brass Key',
    description: 'A heavy, tarnished brass key etched with "307-ARCHIVE".',
    inspectNote: 'Double-notched warded teeth shaped for a small cabinet or bookshelf latch.',
    usableContext: 'Select to arm, then insert into the Bookshelf compartment keyhole.',
  },
  mysterious_paper: {
    id: 'mysterious_paper',
    name: 'Mysterious Paper',
    shortLabel: 'Torn Note',
    description: 'A folded slip recovered from the locked study drawer.',
    inspectNote:
      '"Knowledge has an order. Arrange the four books from oldest to newest. Their spine digits will speak."',
    usableContext: 'Examine closely to decode the Bookshelf archive order.',
  },
  uv_torch: {
    id: 'uv_torch',
    name: 'UV Flashlight',
    shortLabel: 'UV Torch',
    description: 'A rugged 365nm ultraviolet inspection torch with fresh lithium cells.',
    inspectNote:
      'Emits a narrow 365nm violet beam capable of fluorescing hidden phosphor ink.',
    usableContext: 'Activate and sweep its beam across the Wall Poster to uncover hidden markings.',
  },
};

export const EVIDENCE_ITEMS: Record<EvidenceId, EvidenceItemMeta> = {
  ev_mystery_note: {
    id: 'ev_mystery_note',
    title: 'Desk Riddle Note',
    objectId: 'study_table',
    objectLabel: 'Study Table',
    stage: 1,
    shortDescription: 'Handwritten challenge left beside the desk lamp.',
    detailNote:
      '"Count what teaches you, what guides you, and what tells you time."',
    markerSymbol: 'NOTE',
  },
  ev_bookshelf_count: {
    id: 'ev_bookshelf_count',
    title: 'Four Dated Volumes',
    objectId: 'bookshelf',
    objectLabel: 'Bookshelf',
    stage: 1,
    shortDescription: 'Four bound engineering textbooks arranged on eye-level shelf.',
    detailNote:
      'Books A (2018), B (2022), C (2015), and D (2020) stand upright next to a locked brass latch.',
    markerSymbol: 'I',
  },
  ev_poster_stars: {
    id: 'ev_poster_stars',
    title: 'Astronomy Star Print',
    objectId: 'wall_poster',
    objectLabel: 'Wall Poster',
    stage: 1,
    shortDescription: 'Night-sky poster reading "The stars guide those who stay awake."',
    detailNote:
      'Two bright golden stars anchor the constellation. Faint glossy streaks shimmer along the margin.',
    markerSymbol: '★',
  },
  ev_clock_alarm: {
    id: 'ev_clock_alarm',
    title: 'Pinned Alarm Marker',
    objectId: 'wall_clock',
    objectLabel: 'Wall Clock',
    stage: 1,
    shortDescription: 'Brass hostel wall clock running in real time with a fixed alarm pin.',
    detailNote:
      'While the main hands keep live time, a crimson alarm pin is jammed squarely at 7:00.',
    markerSymbol: '07:00',
  },
  ev_drawer_paper: {
    id: 'ev_drawer_paper',
    title: 'Archive Edition Slip',
    objectId: 'desk_drawer',
    objectLabel: 'Desk Drawer',
    stage: 2,
    shortDescription: 'Recovered inside the locked 3-digit desk drawer alongside the Brass Key.',
    detailNote:
      '"Knowledge has an order. Arrange the four books from oldest to newest. Their spine digits will speak."',
    markerSymbol: 'SLIP',
  },
  ev_calendar_order: {
    id: 'ev_calendar_order',
    title: 'November Sweep Schedule',
    objectId: 'calendar',
    objectLabel: 'Wall Calendar',
    stage: 2,
    shortDescription: 'Exam calendar marking the midnight Block C inspection.',
    detailNote:
      'Margin pencil note: "Check oldest to newest editions before lights out."',
    markerSymbol: 'NOV 13',
  },
  ev_uv_sequence: {
    id: 'ev_uv_sequence',
    title: 'Ultraviolet Margin Trail',
    objectId: 'wall_poster',
    objectLabel: 'Wall Poster (UV)',
    stage: 3,
    shortDescription: 'Invisible phosphor ink revealed under 365nm ultraviolet sweep.',
    detailNote:
      'Four glowing arrows aligned across the poster margins: UP → RIGHT → DOWN → LEFT.',
    markerSymbol: 'UV',
  },
  ev_bed_chalk: {
    id: 'ev_bed_chalk',
    title: 'Headboard Chalk Rule',
    objectId: 'bed',
    objectLabel: 'Hostel Bed',
    stage: 3,
    shortDescription: 'Faint chalk warning etched beneath the iron cot rail.',
    detailNote:
      '"Count carefully. Sort by year. Follow the unseen light."',
    markerSymbol: 'CHALK',
  },
};

export const EVIDENCE_ORDER: EvidenceId[] = [
  'ev_mystery_note',
  'ev_bookshelf_count',
  'ev_poster_stars',
  'ev_clock_alarm',
  'ev_drawer_paper',
  'ev_calendar_order',
  'ev_uv_sequence',
  'ev_bed_chalk',
];

export const PUZZLE_HINTS: Record<PuzzleStage, [string, string]> = {
  1: [
    'Look carefully at the objects mentioned in the note. Each represents something you can count.',
    'The order in which the note mentions the objects matters.',
  ],
  2: [
    'The years on the books are more important than their titles.',
    'Think about arranging the books chronologically.',
  ],
  3: [
    'The UV torch reveals something that ordinary light cannot.',
    'Observe the four symbols and their sequence carefully.',
  ],
};

export const ROOM_OBJECTS: Record<RoomObjectId, RoomObjectMeta> = {
  study_table: {
    id: 'study_table',
    name: 'Study Table',
    subtitle: 'Desk Lamp, Phone, Calculator & Letter',
    description:
      'Your roommate sits hunched over a textbook under the warm tungsten lamp. Beside a vibrating phone and scientific calculator rests the folded mystery note.',
    clueTitle: 'Mysterious Note',
    clueText:
      '"Count what teaches you, what guides you, and what tells you time." Look at the Bookshelf, the Wall Poster, and the Wall Clock.',
    evidenceId: 'ev_mystery_note',
    cameraPosition: [-1.15, 1.55, 0.25],
    cameraTarget: [-2.1, 0.92, -1.6],
    hotspotAnchor: [-2.1, 1.15, -1.65],
  },
  desk_drawer: {
    id: 'desk_drawer',
    name: 'Desk Drawer',
    subtitle: '3-Digit Keypad Lock',
    description:
      'The right-side drawer of the study table is fitted with a solid brass 3-digit combination lock.',
    clueTitle: 'Lock Mechanism (Stage 1)',
    clueText:
      'Requires a 3-digit code derived from what teaches you, what guides you, and what tells you time.',
    cameraPosition: [-0.95, 1.12, -0.35],
    cameraTarget: [-1.72, 0.72, -1.62],
    hotspotAnchor: [-1.72, 0.72, -1.35],
  },
  bookshelf: {
    id: 'bookshelf',
    name: 'Bookshelf',
    subtitle: 'Four Volumes & Hidden Latch',
    description:
      'A tall wooden hostel bookshelf leaning against the back wall. Exactly four bound engineering books stand neatly on the eye-level shelf beside a small brass keyhole.',
    clueTitle: 'Shelf Count & Secret Compartment',
    clueText:
      'There are 4 books standing on the main shelf. A locked brass latch hides a secret compartment inside.',
    evidenceId: 'ev_bookshelf_count',
    cameraPosition: [-0.45, 1.62, -0.15],
    cameraTarget: [-0.45, 1.45, -2.38],
    hotspotAnchor: [-0.45, 1.55, -2.25],
  },
  wall_clock: {
    id: 'wall_clock',
    name: 'Wall Clock',
    subtitle: 'Live Hostel Timepiece · Alarm Pinned at 7:00',
    description:
      'A brass-rimmed hostel wall clock whose second, minute, and hour hands tick continuously in real time—yet a red brass alarm hand is locked firmly onto 7:00.',
    clueTitle: 'Clock Reading',
    clueText:
      'While the clock runs live in real time, the locked red alarm marker points squarely to 7 (7:00).',
    evidenceId: 'ev_clock_alarm',
    cameraPosition: [-1.5, 2.25, -0.5],
    cameraTarget: [-1.85, 2.28, -2.55],
    hotspotAnchor: [-1.85, 2.28, -2.45],
  },
  wall_poster: {
    id: 'wall_poster',
    name: 'Wall Poster',
    subtitle: 'Night Sky Print ("Guide")',
    description:
      'An astronomy club poster taped to the left plaster wall: "THE STARS GUIDE THOSE WHO STAY AWAKE." Two bright gold stars are printed prominently.',
    clueTitle: 'Stars & Hidden Ink',
    clueText:
      'Two bright stars gleam in ordinary light. Faint glossy streaks shimmer strangely along the margins—unreadable without ultraviolet light.',
    evidenceId: 'ev_poster_stars',
    cameraPosition: [-1.05, 1.78, -0.35],
    cameraTarget: [-2.85, 1.75, -0.4],
    hotspotAnchor: [-2.78, 1.78, -0.4],
  },
  calendar: {
    id: 'calendar',
    name: 'Wall Calendar',
    subtitle: 'Exam & Inspection Schedule',
    description:
      'A spiral-bound college calendar pinned near the bookshelf. Tonight’s date is circled furiously in red ink.',
    clueTitle: 'Warden Schedule',
    clueText:
      '"FINAL NIGHT — WARDEN CORRIDOR SWEEP AT MIDNIGHT." A margin note reads: "Check oldest to newest editions before lights out."',
    evidenceId: 'ev_calendar_order',
    cameraPosition: [0.65, 1.75, -0.55],
    cameraTarget: [0.65, 1.72, -2.52],
    hotspotAnchor: [0.65, 1.72, -2.42],
  },
  backpack: {
    id: 'backpack',
    name: 'Backpack',
    subtitle: 'Canvas College Bag',
    description:
      'Your worn navy canvas backpack slumped beside the study chair, zippers half-open after evening labs.',
    clueTitle: 'Front Pocket Zip',
    clueText:
      'Unzip the front canvas compartment to examine what you brought back from evening labs.',
    cameraPosition: [-0.85, 0.95, -0.15],
    cameraTarget: [-1.35, 0.35, -0.95],
    hotspotAnchor: [-1.35, 0.45, -0.95],
  },
  wardrobe: {
    id: 'wardrobe',
    name: 'Steel Wardrobe',
    subtitle: 'Hostel Almirah',
    description:
      'A classic powder-coated steel hostel almirah with ventilator louvers and a slightly ajar door.',
    clueTitle: 'Almirah Compartment',
    clueText:
      'Pull open the right steel door to inspect the laminated hostel notice and top shelf.',
    cameraPosition: [1.1, 1.45, 0.15],
    cameraTarget: [2.35, 1.25, -1.75],
    hotspotAnchor: [2.15, 1.35, -1.65],
  },
  bed: {
    id: 'bed',
    name: 'Hostel Bed',
    subtitle: 'Iron Cot & Checked Blanket',
    description:
      'A narrow steel-frame hostel cot pushed against the right wall with a crumpled checked cotton sheet and study pillow.',
    clueTitle: 'Pillow & Iron Frame',
    clueText:
      'Lift the pillow and inspect the iron headboard rail for late-night markings.',
    evidenceId: 'ev_bed_chalk',
    cameraPosition: [0.65, 1.25, 0.85],
    cameraTarget: [2.05, 0.65, 0.85],
    hotspotAnchor: [2.0, 0.72, 0.85],
  },
  exit_door: {
    id: 'exit_door',
    name: 'Hostel Exit Door',
    subtitle: 'Room 307 · Directional Deadbolt',
    description:
      'The heavy wooden corridor door of Room 307. Rain-cooled air seeps under the threshold. Beside the brass handle sits a 4-way directional deadbolt.',
    clueTitle: 'Final Lock Mechanism (Stage 3)',
    clueText:
      'Requires a 4-direction sequence (UP / RIGHT / DOWN / LEFT). Complete Stages 1 and 2 first, then sweep the UV torch across the Wall Poster.',
    cameraPosition: [0.25, 1.42, 0.75],
    cameraTarget: [0.45, 1.32, 2.58],
    hotspotAnchor: [0.45, 1.35, 2.45],
  },
};

export const ROOM_OBJECT_ORDER: RoomObjectId[] = [
  'study_table',
  'desk_drawer',
  'bookshelf',
  'wall_clock',
  'wall_poster',
  'calendar',
  'backpack',
  'wardrobe',
  'bed',
  'exit_door',
];

export const WARDEN_THREAT_META: Record<
  WardenThreatState,
  {
    label: string;
    shortStatus: string;
    detail: string;
    severity: 0 | 1 | 2 | 3 | 4 | 5;
  }
> = {
  DORMANT: {
    label: 'Ground Wing Patrol',
    shortStatus: 'DORMANT',
    detail: 'All quiet outside. Warden is signing the Ground Floor register.',
    severity: 0,
  },
  APPROACHING: {
    label: 'Stairwell Footsteps',
    shortStatus: 'APPROACHING',
    detail: 'Heavy footsteps ascend the concrete stairwell toward Block C 3rd floor.',
    severity: 1,
  },
  OUTSIDE_ROOM: {
    label: 'Third Floor Corridor',
    shortStatus: 'OUTSIDE ROOM',
    detail: 'Torchlight sweeps past Rooms 305 and 306. A shadow lingers near 307.',
    severity: 2,
  },
  INSPECTING_DOOR: {
    label: 'Inspecting Door 307',
    shortStatus: 'INSPECTING DOOR',
    detail: 'Slow knocks echo along the corridor. Lights dip as the Warden checks latches.',
    severity: 3,
  },
  IMMINENT_ARRIVAL: {
    label: 'At Your Threshold',
    shortStatus: 'IMMINENT ARRIVAL',
    detail: 'Keys rattle outside Room 307! The brass lever handle twitches from outside.',
    severity: 4,
  },
  ARRIVED: {
    label: 'Inspection Midnight',
    shortStatus: 'ARRIVED',
    detail: 'The Warden has reached Room 307.',
    severity: 5,
  },
};

export const VICTORY_CLASSIFICATION_META: Record<
  VictoryClassification,
  {
    title: string;
    badge: string;
    headline: string;
    summary: string;
    accentClass: string;
    borderClass: string;
    bgClass: string;
  }
> = {
  PERFECT_ESCAPE: {
    title: 'PERFECT ESCAPE',
    badge: '0 HINTS USED · CLEAN SOLVE',
    headline: 'Sharp Instincts Under Midnight Pressure',
    summary:
      'You cracked every lock purely through observation, evidence synthesis, and logic—leaving not a single clue unverified.',
    accentClass: 'text-emerald-300',
    borderClass: 'border-emerald-400/50',
    bgClass: 'bg-emerald-950/35',
  },
  SMART_ESCAPE: {
    title: 'SMART ESCAPE',
    badge: '1 HINT USED · TACTICAL SOLVE',
    headline: 'Calculated Under the Wire',
    summary:
      'You balanced independent deduction with one well-timed nudge, staying ahead of the Warden’s Block C sweep.',
    accentClass: 'text-sky-300',
    borderClass: 'border-sky-400/50',
    bgClass: 'bg-sky-950/35',
  },
  NARROW_ESCAPE: {
    title: 'NARROW ESCAPE',
    badge: '2 HINTS USED · LAST-SECOND BREACH',
    headline: 'Slipped Out as the Keys Jangled',
    summary:
      'You exhausted both lifelines and pulled open Door 307 moments before the corridor sweep reached your threshold.',
    accentClass: 'text-amber-300',
    borderClass: 'border-amber-400/50',
    bgClass: 'bg-amber-950/35',
  },
};

// Strictly optional fictional storytelling on the hostel phone — ZERO puzzle codes or extra hints
export const PHONE_MESSAGES: PhoneMessage[] = [
  {
    id: 'msg_floor_rep',
    sender: 'Arjun (Floor Rep · 304)',
    role: 'Hostel Group Chat',
    time: '11:47 PM',
    preview: 'Warden started round early from ground wing!',
    body: 'Guys, Warden Sharma grabbed the master key ring early tonight. He already locked the south staircase. Anyone still roaming Block C, stay inside and lock up!',
  },
  {
    id: 'msg_roommate',
    sender: 'Vikram (Roommate)',
    role: 'Direct Message',
    time: '11:39 PM',
    preview: 'Finish your security check before 12...',
    body: 'Bro I still have 30 pages of Signals left before tomorrow’s viva. Do NOT ask me to get up from this desk—if the OWASP seniors sealed Door 307 as an initiation test, you’re solving it yourself!',
  },
  {
    id: 'msg_canteen',
    sender: 'Night Canteen Ravi',
    role: 'Campus Broadcast',
    time: '11:18 PM',
    preview: 'Last batch of ginger chai & Maggi sold out',
    body: 'Closing counter early because Hostel Proctor is doing rounds with Warden Sharma. Leftovers resume after 12:30 AM if you survive roll call.',
  },
];

export const PHONE_MISSED_CALLS: PhoneMissedCall[] = [
  {
    id: 'call_warden',
    caller: 'Warden Office · Block C',
    tag: 'EXT 300',
    time: '11:44 PM',
    attempts: 2,
    note: 'Curfew warning tone · No message left',
  },
  {
    id: 'call_seniors',
    caller: 'OWASP Wing Seniors',
    tag: 'UNKNOWN',
    time: '11:31 PM',
    attempts: 1,
    note: 'Voicemail recorded (12s)',
  },
  {
    id: 'call_arjun',
    caller: 'Arjun · Room 304',
    tag: 'FLOOR REP',
    time: '11:25 PM',
    attempts: 1,
    note: 'Voicemail recorded (10s)',
  },
];

export const PHONE_PHOTOS: PhonePhotoMeta[] = [
  {
    id: 'photo_corridor',
    title: 'Block C Corridor · 11:20 PM',
    timestamp: '11:20 PM',
    location: '3rd Floor Wing',
    caption: 'Fluorescent tubes buzzing above the terrazzo corridor right before lockdown.',
    sceneVariant: 'corridor',
  },
  {
    id: 'photo_desk',
    title: 'Late Night Cram Session',
    timestamp: '10:55 PM',
    location: 'Room 307',
    caption: 'Vikram refusing to blink before the CS-401 morning quiz.',
    sceneVariant: 'desk',
  },
  {
    id: 'photo_chai',
    title: 'Rain at Main Gate Stall',
    timestamp: '09:42 PM',
    location: 'South Canteen',
    caption: 'Monsoon drizzle rolling in right before we sprinted back to Block C.',
    sceneVariant: 'chai',
  },
];

export const PHONE_VOICEMAILS: PhoneVoicemail[] = [
  {
    id: 'vm_1',
    caller: 'OWASP Wing Seniors',
    time: '11:31 PM',
    durationSec: 12,
    transcript:
      '"Welcome to the midnight tradition, freshie. Everything in Room 307 was placed there for a reason. Trust what you see, not rumors."',
  },
  {
    id: 'vm_2',
    caller: 'Arjun · Room 304',
    time: '11:25 PM',
    durationSec: 10,
    transcript:
      '"Hey, if you left your room door bolted from inside, don’t panic—I heard someone shuffling near the stairwell ten minutes ago."',
  },
];

// Relationship descriptions for pairs of already-discovered clues on the Investigation Board
export const EVIDENCE_LINK_DESCRIPTIONS: Record<string, string> = {
  'ev_bookshelf_count|ev_mystery_note': 'Count "what teaches you" → Bookshelf volumes',
  'ev_mystery_note|ev_poster_stars': 'Count "what guides you" → Poster stars',
  'ev_clock_alarm|ev_mystery_note': 'Count "what tells you time" → Clock alarm marker',
  'ev_calendar_order|ev_drawer_paper': 'Archive chronology rule matches exam calendar margin',
  'ev_bookshelf_count|ev_drawer_paper': 'Edition slip applies directly to the four dated volumes',
  'ev_bookshelf_count|ev_calendar_order': 'Four dated books match the library archival note',
  'ev_poster_stars|ev_uv_sequence': 'Same astronomy print holds invisible UV ink trail',
  'ev_bed_chalk|ev_mystery_note': 'Headboard warning echoes the desk letter rules',
  'ev_bed_chalk|ev_uv_sequence': '"Follow the unseen light" points to UV phosphor markings',
};

export function getEvidencePairKey(a: EvidenceId, b: EvidenceId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

