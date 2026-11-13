import { CampaignId, CampaignMetadata } from '../types/platform';

export const PLATFORM_TITLE = 'ESCAPE FILES';
export const PLATFORM_SUBTITLE = 'THE HOSTEL CHRONICLES';
export const PLATFORM_TAGLINE = 'Three mysteries. One forgotten truth.';
export const PLATFORM_MASTER_TAGLINE = 'Three locations. Three mysteries. Nine locks. One hidden truth.';

export const CAMPAIGN_ORDER: CampaignId[] = ['easy', 'medium', 'difficult'];

export const CAMPAIGNS: Record<CampaignId, CampaignMetadata> = {
  easy: {
    id: 'easy',
    numberLabel: 'CAMPAIGN 01',
    title: 'THE LOST ROOM KEY',
    subtitle: 'Hostel Block C · Room 307',
    difficulty: 'EASY',
    location: 'Room 307 · Third Floor Hostel Wing',
    estimatedMinutes: 8,
    standardDurationSeconds: 480,
    demoDurationSeconds: 150,
    lockCount: 3,
    objectCount: 10,
    evidenceCount: 8,
    storyIntro:
      'Locked inside Room 307 before midnight roll call, decipher your roommate’s study riddles, recover the brass key, and reveal an ultraviolet corridor trail before the Warden reaches the door.',
    environmentPreview: 'Warm tungsten desk lamp, monsoon rain window, live clock, OWASP room setup.',
    lockNames: ['Desk Drawer Keypad', 'Archive Bookshelf Latch', 'Directional Deadbolt'],
    accentColor: 'amber',
  },
  medium: {
    id: 'medium',
    numberLabel: 'CAMPAIGN 02',
    title: 'THE MIDNIGHT TRANSMISSION',
    subtitle: 'Basement Radio Station · Sub-Level 1',
    difficulty: 'MEDIUM',
    location: 'Abandoned Hostel Radio Bunker',
    estimatedMinutes: 12,
    standardDurationSeconds: 720,
    demoDurationSeconds: 180,
    lockCount: 3,
    objectCount: 10,
    evidenceCount: 8,
    storyIntro:
      'Following the corridor clue beneath Block C reveals a sealed 1998 student radio bunker. Rewire the dead transmitter circuit, decode the phantom Morse signal, and lock the analog frequency dial.',
    environmentPreview: 'Cold industrial basement, glowing green CRT oscilloscope, spinning tape reels, beacon strobe.',
    lockNames: ['The Dead Circuit', 'The Silent Signal (Morse)', 'The Final Frequency'],
    accentColor: 'sky',
  },
  difficult: {
    id: 'difficult',
    numberLabel: 'CAMPAIGN 03',
    title: "THE WARDEN'S LAST SECRET",
    subtitle: 'Sub-Basement Archive · Vault B',
    difficulty: 'DIFFICULT',
    location: 'Sealed Underground Hostel Archive',
    estimatedMinutes: 18,
    standardDurationSeconds: 1080,
    demoDurationSeconds: 240,
    lockCount: 3,
    objectCount: 10,
    evidenceCount: 8,
    storyIntro:
      'Station 88.4 led straight into the forgotten sub-basement archive beneath Block C. Break the antique Caesar cipher, reconstruct the four conflicting witness timelines, and unlock the Warden’s mechanical vault.',
    environmentPreview: 'Warm brass banker lamps, oak ledger racks, floating dust motes, circular iron vault door.',
    lockNames: ['The Archive Cipher', "The Warden's Timeline", 'The Mechanical Vault'],
    accentColor: 'emerald',
  },
};
