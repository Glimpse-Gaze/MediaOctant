import { TRAITS } from "./traits";

type TraitCode = (typeof TRAITS)[number]["code"];

export type SeedForm = {
  name: string;
  slug: string;
  description: string;
  scores: Record<TraitCode, number>;
  descriptions: Partial<Record<TraitCode, string>>;
  tags?: string[];
  freeform?: Array<{ name: string; value: string }>;
};

/** Evaluated media from octant sessions (upserted into cloud Postgres). */
export const RATED_FORMS: SeedForm[] = [
  {
    name: "Kage-e no tawamure",
    slug: "kage-e-no-tawamure",
    description:
      'Japanese domestic shadow toy (c. 18th–19th c.): two ink-painted washi cutouts mounted crosswise on a split bamboo skewer, projected with a lantern onto a wall or shōji; rotating the stick 90° switches the silhouette (e.g. Tamamo-no-Mae → fox). Rated as the full typical play experience (setup, narration/music/onomatopoeia, social exchange). Omitted: shadowgraphy (hand/body shadows), theatrical shadow play, and phantasmagoria.',
    scores: { VIS: 9, AUD: 4, EMB: 7, LIV: 6.5, SEM: 8, MAT: 5, RAU: 4.5, TMP: 3 },
    descriptions: {
      VIS: "Meaning is carried almost entirely by projected silhouettes; the transformation is read visually.",
      AUD: "No hard proof of accompaniment, but the typical experience likely included narration, music, or playful vocalization to time and motivate transformations—analogous to silent cinema.",
      EMB: "Domestic pastime: audience often equals operator; requires DIY preparation, lantern setup, rotation, and social exchange (showing how the trick works).",
      LIV: 'Transformation exists only as a live enactment; mostly domestic/informal rather than organized public performance—an "activated print."',
      SEM: "Figures decoded iconically through silhouette and posture; cultural knowledge of attested themes helps but medium is depictive.",
      MAT: "Mixed carrier: meaning lives primarily in shadows but audience sees and handles the puppet and lantern apparatus.",
      RAU: "Two pre-designed states make the object partly self-explanatory; metamorphosis meaning still needs rotation and narration to fully cohere.",
      TMP: "Puppet mostly rests in one state; rotation is a punctual dramatic beat rather than sustained sequential grammar (cf. tachi-e kamishibai ~4.5).",
    },
    tags: ["Japan", "performance"],
  },
  {
    name: "Silent Cinema",
    slug: "silent-cinema",
    description:
      "Theatrical exhibition of projected film (c. 1895–1920s) as a live composite spectacle: moving images plus piano/orchestra/organ, benshi or bonimenteur narration, live sound effects, visible projectionist, and vocal audiences. Rated as the typical historical cinema-going experience. Omitted: home viewing and the celluloid strip in isolation.",
    scores: { VIS: 9, AUD: 7, EMB: 3, LIV: 6, SEM: 6, MAT: 2, RAU: 8, TMP: 9 },
    descriptions: {
      VIS: "Moving images remain the primary channel; accompaniment supports but does not replace visual storytelling.",
      AUD: "Music, narration, effects, and audience noise were structurally constitutive of the historical experience, though vision still leads.",
      EMB: "Audience mostly sits and watches; vocal participation adds communal energy but not bodily interaction with the medium.",
      LIV: "Film strip is stable but the work as experienced was assembled live in the theater through variable accompaniment and projection choices.",
      SEM: "Hybrid: iconic acting and mise-en-scène plus symbolic intertitles and spoken narration where present.",
      MAT: "Meaning perceived through projected light on screen; apparatus may be visible but carrier is immaterial to the audience.",
      RAU: "Film strip encodes most narrative before screening; live elements interpret rather than generate core representation (lower in benshi-heavy contexts).",
      TMP: "Meaning depends on ordered temporal progression of shots and scenes; skipping or reordering breaks comprehension.",
    },
    tags: ["performance", "cinema"],
  },
  {
    name: "Sound Cinema",
    slug: "sound-cinema",
    description:
      "Theatrical exhibition of synchronized talkies on celluloid (c. late 1920s–1960s/70s) before home video: image and optical soundtrack locked on one print, hidden projectionist, passive audience, behind-screen speakers. Rated as standardized cinema-theater viewing. Omitted: home formats (VHS, tape, CD) and author-side production.",
    scores: { VIS: 9, AUD: 9, EMB: 2, LIV: 2, SEM: 5.5, MAT: 2, RAU: 9, TMP: 9.5 },
    descriptions: {
      VIS: "Vision remains the primary semiotic channel despite synchronized dialogue and sound design.",
      AUD: "Dialogue, score, and effects on the film strip are indispensable—talkies cannot be fully decoded without listening.",
      EMB: "Deliberately passive standardized consumption; no audience manipulation or physical engagement expected.",
      LIV: "Predetermined repeatable artifact; theatrical attendance is distribution not constitutive live performance.",
      SEM: "Hybrid with slight shift toward symbolic pole via spoken dialogue replacing most intertitles.",
      MAT: "Total theatrical illusion: projected light and amplified sound; machinery and print hidden from audience.",
      RAU: "Complete A/V package encoded on celluloid before exhibition; projection is playback only.",
      TMP: "Picture locked to soundtrack at 24 fps; rigid sequential grammar—reordering breaks sync and meaning.",
    },
    tags: ["cinema"],
  },
  {
    name: "Magic Lantern Shows",
    slug: "magic-lantern-shows",
    description:
      'Spectacular narrative magic lantern exhibition (19th c.): multi-lantern dissolving views, mechanical/lever/slipping slides, life-model and pose slides, live lecturer with reading scripts, music, sing-along slides, and backstage sound effects. Rated as major narrative lantern shows. Omitted: toy lanterns, plain educational lectures, and phantasmagoria.',
    scores: { VIS: 8.5, AUD: 7.5, EMB: 3.5, LIV: 7, SEM: 6, MAT: 2.5, RAU: 5, TMP: 7 },
    descriptions: {
      VIS: "Projected images dominate; lecturer carries substantial narrative load but meaning is predominantly visual.",
      AUD: 'Visual track was "half the show": lecturer, music, sing-alongs, and effects were structurally constitutive.',
      EMB: "Mostly seated reception; sing-along slides add communal vocal participation but not bodily manipulation.",
      LIV: "Ephemeral live synthesis: slide selection, order, repeats, and accompaniment varied—no two shows identical.",
      SEM: "Hybrid: photographic/painted iconic slides plus substantial linguistic delivery via lecturer and sing-along lyrics.",
      MAT: "Meaning primarily perceived through projected light; glass slides hidden behind apparatus.",
      RAU: "Individual slides carry iconic content but lecturer and operator substantially complete narrative and sequence.",
      TMP: "Slide sets designed for order but live performance routinely reordered and repeated slides for audience response.",
    },
    tags: ["performance"],
  },
  {
    name: "Panorama",
    slug: "panorama",
    description:
      "Static 360° rotunda panorama (Barker patent 1787): colossal circular canvas with trompe-l'œil perspective, central viewing platform, hidden horizon (velum and barrier), faux-terrain foreground, and natural skylight. Rated as fixed rotunda installation. Omitted: moving panoramas and diorama as separate forms.",
    scores: { VIS: 9.5, AUD: 0.5, EMB: 5, LIV: 2, SEM: 9, MAT: 5, RAU: 9.5, TMP: 2 },
    descriptions: {
      VIS: "Entire apparatus engineered for immersive visual simulation; no other channel required.",
      AUD: "Silent optical spectacle; no structurally integral sound component described.",
      EMB: "Viewers walk the circular platform and choose viewing angles—spatial navigation designed into the experience.",
      LIV: "Permanent installation; natural light shifts add atmosphere but meaning does not depend on unique live performance.",
      SEM: 'Meaning decoded iconically through depiction, perspective, and spatial simulation—the "reality illusion."',
      MAT: "Mixed carrier: canvas and faux terrain are material but design suppresses material awareness in favor of simulated space.",
      RAU: "Full representational world present before audience arrives; no performance or manipulation required.",
      TMP: "Static simultaneous 360° state; circumambulation is spatial exploration not medium-imposed temporal sequence.",
    },
    tags: ["performance", "visual-art"],
  },
  {
    name: "Etoki (monastic)",
    slug: "etoki-monastic",
    description:
      'Monastic etoki (絵解き) 8th–14th c.: Buddhist missionary "picture explaining" in temples and festivals. Monk uses pointer on massive hanging scrolls, screens, or mandalas while delivering stylized rhythmic chant-speech; audience static, participating through prayer and weeping. Rated as live monastic performance. Omitted: secular street etoki.',
    scores: { VIS: 8.5, AUD: 7.5, EMB: 2.5, LIV: 7.5, SEM: 6.5, MAT: 8, RAU: 4.5, TMP: 7 },
    descriptions: {
      VIS: "Dense painted scrolls and mandalas carry meaning; pointer directs but does not replace visual iconography.",
      AUD: "Stylized chant-speech essential for illiterate audiences to decode doctrinal content from dense imagery.",
      EMB: "Audience physically static looking upward; communal vocal participation (chanting, weeping) but no bodily manipulation.",
      LIV: "Live temple/festival event constitutive: scroll plus monk plus pointer plus chant—not the scroll alone.",
      SEM: "Hybrid: iconic mandala/hell imagery plus substantial doctrinal decoding through stylized speech.",
      MAT: "Monumental physical scrolls, screens, and mandalas directly visible as tangible meaning-carriers.",
      RAU: "Scroll encodes visual narrative but sequential meaning emerges through live pointing and chanting.",
      TMP: "Pointer creates sequential narrative flow from a single static canvas—live temporal ordering of scenes.",
    },
    tags: ["Japan", "performance"],
  },
  {
    name: "Etoki (performative)",
    slug: "etoki-performative",
    description:
      "Street etoki (絵解き) from 14th c.: commercial itinerant picture-explaining by Kumano bikuni and similar performers. Portable paper/cloth scrolls at crossroads and markets; theatrical voice-acting, instruments, cliffhanger pauses for payment, talisman sales tied to hell imagery. Rated as secular street performance. Omitted: monastic temple etoki.",
    scores: { VIS: 8.5, AUD: 8, EMB: 3, LIV: 8, SEM: 6, MAT: 7.5, RAU: 4, TMP: 7.5 },
    descriptions: {
      VIS: "Same scroll-based visual logic with sensational graphic hell imagery driving curiosity and commerce.",
      AUD: "Theatrical voice-acting for characters plus gongs, bells, and lutes—richer sound design than monastic chant.",
      EMB: "Mostly passive viewing in a loose circle; coin payment and commercial exchange add social participation.",
      LIV: "Pop-up itinerant gatherings at crossroads and markets—each performance ephemeral and mobile.",
      SEM: "Hybrid shifted toward iconic spectacle and entertainment with commercial rather than doctrinal verbal framing.",
      MAT: "Still a material scroll but portable paper/cloth rather than monumental temple hangings.",
      RAU: "Cliffhanger pauses gate narrative continuation—performance even more essential to complete the experience.",
      TMP: "Sequential revelation plus deliberate temporal withholding at cliffhangers for payment—stronger performer-controlled pacing.",
    },
    tags: ["Japan", "performance"],
  },
];
