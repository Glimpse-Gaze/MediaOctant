/**
 * One-shot import of collaborator-supplied media forms with fixed-trait notes.
 * Usage: npx tsx scripts/import-forms-batch.ts
 */
import { PrismaClient } from "@prisma/client";
import { makeSlug } from "../src/lib/normalize";

const prisma = new PrismaClient();

type TraitCode = "VIS" | "AUD" | "EMB" | "LIV" | "SEM" | "MAT" | "RAU" | "TMP";

type FormImport = {
  name: string;
  description: string;
  scores: Record<TraitCode, { value: number; note: string }>;
};

const FORMS: FormImport[] = [
  {
    name: "Kage-e no tawamure",
    description:
      "Japanese domestic shadow toy (c. 18th–19th c.): two ink-painted washi cutouts mounted crosswise on a split bamboo skewer, projected with a lantern onto a wall or shōji; rotating the stick 90° switches the silhouette (e.g. Tamamo-no-Mae → fox). Rated as the full typical play experience (setup, narration/music/onomatopoeia, social exchange). Omitted: shadowgraphy (hand/body shadows), theatrical shadow play, and phantasmagoria.",
    scores: {
      VIS: {
        value: 9,
        note: "Meaning is carried almost entirely by projected silhouettes; the transformation is read visually.",
      },
      AUD: {
        value: 4,
        note: "No hard proof of accompaniment, but the typical experience likely included narration, music, or playful vocalization to time and motivate transformations—analogous to silent cinema.",
      },
      EMB: {
        value: 7,
        note: "Domestic pastime: audience often equals operator; requires DIY preparation, lantern setup, rotation, and social exchange (showing how the trick works).",
      },
      LIV: {
        value: 6.5,
        note: "Transformation exists only as a live enactment; mostly domestic/informal rather than organized public performance—an “activated print.”",
      },
      SEM: {
        value: 8,
        note: "Figures decoded iconically through silhouette and posture; cultural knowledge of attested themes helps but medium is depictive.",
      },
      MAT: {
        value: 5,
        note: "Mixed carrier: meaning lives primarily in shadows but audience sees and handles the puppet and lantern apparatus.",
      },
      RAU: {
        value: 4.5,
        note: "Two pre-designed states make the object partly self-explanatory; metamorphosis meaning still needs rotation and narration to fully cohere.",
      },
      TMP: {
        value: 3,
        note: "Puppet mostly rests in one state; rotation is a punctual dramatic beat rather than sustained sequential grammar (cf. tachi-e kamishibai ~4.5).",
      },
    },
  },
  {
    name: "Silent Cinema",
    description:
      "Theatrical exhibition of projected film (c. 1895–1920s) as a live composite spectacle: moving images plus piano/orchestra/organ, benshi or bonimenteur narration, live sound effects, visible projectionist, and vocal audiences. Rated as the typical historical cinema-going experience. Omitted: home viewing and the celluloid strip in isolation.",
    scores: {
      VIS: {
        value: 9,
        note: "Moving images remain the primary channel; accompaniment supports but does not replace visual storytelling.",
      },
      AUD: {
        value: 7,
        note: "Music, narration, effects, and audience noise were structurally constitutive of the historical experience, though vision still leads.",
      },
      EMB: {
        value: 3,
        note: "Audience mostly sits and watches; vocal participation adds communal energy but not bodily interaction with the medium.",
      },
      LIV: {
        value: 6,
        note: "Film strip is stable but the work as experienced was assembled live in the theater through variable accompaniment and projection choices.",
      },
      SEM: {
        value: 6,
        note: "Hybrid: iconic acting and mise-en-scène plus symbolic intertitles and spoken narration where present.",
      },
      MAT: {
        value: 2,
        note: "Meaning perceived through projected light on screen; apparatus may be visible but carrier is immaterial to the audience.",
      },
      RAU: {
        value: 8,
        note: "Film strip encodes most narrative before screening; live elements interpret rather than generate core representation (lower in benshi-heavy contexts).",
      },
      TMP: {
        value: 9,
        note: "Meaning depends on ordered temporal progression of shots and scenes; skipping or reordering breaks comprehension.",
      },
    },
  },
  {
    name: "Sound Cinema",
    description:
      "Theatrical exhibition of synchronized talkies on celluloid (c. late 1920s–1960s/70s) before home video: image and optical soundtrack locked on one print, hidden projectionist, passive audience, behind-screen speakers. Rated as standardized cinema-theater viewing. Omitted: home formats (VHS, tape, CD) and author-side production.",
    scores: {
      VIS: {
        value: 9,
        note: "Vision remains the primary semiotic channel despite synchronized dialogue and sound design.",
      },
      AUD: {
        value: 9,
        note: "Dialogue, score, and effects on the film strip are indispensable—talkies cannot be fully decoded without listening.",
      },
      EMB: {
        value: 2,
        note: "Deliberately passive standardized consumption; no audience manipulation or physical engagement expected.",
      },
      LIV: {
        value: 2,
        note: "Predetermined repeatable artifact; theatrical attendance is distribution not constitutive live performance.",
      },
      SEM: {
        value: 5.5,
        note: "Hybrid with slight shift toward symbolic pole via spoken dialogue replacing most intertitles.",
      },
      MAT: {
        value: 2,
        note: "Total theatrical illusion: projected light and amplified sound; machinery and print hidden from audience.",
      },
      RAU: {
        value: 9,
        note: "Complete A/V package encoded on celluloid before exhibition; projection is playback only.",
      },
      TMP: {
        value: 9.5,
        note: "Picture locked to soundtrack at 24 fps; rigid sequential grammar—reordering breaks sync and meaning.",
      },
    },
  },
  {
    name: "Magic Lantern Shows",
    description:
      "Spectacular narrative magic lantern exhibition (19th c.): multi-lantern dissolving views, mechanical/lever/slipping slides, life-model and pose slides, live lecturer with reading scripts, music, sing-along slides, and backstage sound effects. Rated as major narrative lantern shows. Omitted: toy lanterns, plain educational lectures, and phantasmagoria.",
    scores: {
      VIS: {
        value: 8.5,
        note: "Projected images dominate; lecturer carries substantial narrative load but meaning is predominantly visual.",
      },
      AUD: {
        value: 7.5,
        note: 'Visual track was "half the show": lecturer, music, sing-alongs, and effects were structurally constitutive.',
      },
      EMB: {
        value: 3.5,
        note: "Mostly seated reception; sing-along slides add communal vocal participation but not bodily manipulation.",
      },
      LIV: {
        value: 7,
        note: "Ephemeral live synthesis: slide selection order repeats and accompaniment varied—no two shows identical.",
      },
      SEM: {
        value: 6,
        note: "Hybrid: photographic/painted iconic slides plus substantial linguistic delivery via lecturer and sing-along lyrics.",
      },
      MAT: {
        value: 2.5,
        note: "Meaning primarily perceived through projected light; glass slides hidden behind apparatus.",
      },
      RAU: {
        value: 5,
        note: "Individual slides carry iconic content but lecturer and operator substantially complete narrative and sequence.",
      },
      TMP: {
        value: 7,
        note: "Slide sets designed for order but live performance routinely reordered and repeated slides for audience response.",
      },
    },
  },
  {
    name: "Panorama",
    description:
      "Static 360° rotunda panorama (Barker patent 1787): colossal circular canvas with trompe-l'œil perspective, central viewing platform, hidden horizon (velum and barrier), faux-terrain foreground, and natural skylight. Rated as fixed rotunda installation. Omitted: moving panoramas and diorama as separate forms.",
    scores: {
      VIS: {
        value: 9.5,
        note: "Entire apparatus engineered for immersive visual simulation; no other channel required.",
      },
      AUD: {
        value: 0.5,
        note: "Silent optical spectacle; no structurally integral sound component described.",
      },
      EMB: {
        value: 5,
        note: "Viewers walk the circular platform and choose viewing angles—spatial navigation designed into the experience.",
      },
      LIV: {
        value: 2,
        note: "Permanent installation; natural light shifts add atmosphere but meaning does not depend on unique live performance.",
      },
      SEM: {
        value: 9,
        note: 'Meaning decoded iconically through depiction perspective and spatial simulation—the "reality illusion."',
      },
      MAT: {
        value: 5,
        note: "Mixed carrier: canvas and faux terrain are material but design suppresses material awareness in favor of simulated space.",
      },
      RAU: {
        value: 9.5,
        note: "Full representational world present before audience arrives; no performance or manipulation required.",
      },
      TMP: {
        value: 2,
        note: "Static simultaneous 360° state; circumambulation is spatial exploration not medium-imposed temporal sequence.",
      },
    },
  },
  {
    name: "Etoki (monastic)",
    description:
      'Monastic etoki (絵解き) 8th–14th c.: Buddhist missionary "picture explaining" in temples and festivals. Monk uses pointer on massive hanging scrolls screens or mandalas while delivering stylized rhythmic chant-speech; audience static, participating through prayer and weeping. Rated as live monastic performance. Omitted: secular street etoki.',
    scores: {
      VIS: {
        value: 8.5,
        note: "Dense painted scrolls and mandalas carry meaning; pointer directs but does not replace visual iconography.",
      },
      AUD: {
        value: 7.5,
        note: "Stylized chant-speech essential for illiterate audiences to decode doctrinal content from dense imagery.",
      },
      EMB: {
        value: 2.5,
        note: "Audience physically static looking upward; communal vocal participation (chanting weeping) but no bodily manipulation.",
      },
      LIV: {
        value: 7.5,
        note: "Live temple/festival event constitutive: scroll plus monk plus pointer plus chant—not the scroll alone.",
      },
      SEM: {
        value: 6.5,
        note: "Hybrid: iconic mandala/hell imagery plus substantial doctrinal decoding through stylized speech.",
      },
      MAT: {
        value: 8,
        note: "Monumental physical scrolls screens and mandalas directly visible as tangible meaning-carriers.",
      },
      RAU: {
        value: 4.5,
        note: "Scroll encodes visual narrative but sequential meaning emerges through live pointing and chanting.",
      },
      TMP: {
        value: 7,
        note: "Pointer creates sequential narrative flow from a single static canvas—live temporal ordering of scenes.",
      },
    },
  },
  {
    name: "Etoki (performative)",
    description:
      "Street etoki (絵解き) from 14th c.: commercial itinerant picture-explaining by Kumano bikuni and similar performers. Portable paper/cloth scrolls at crossroads and markets; theatrical voice-acting, instruments, cliffhanger pauses for payment, talisman sales tied to hell imagery. Rated as secular street performance. Omitted: monastic temple etoki.",
    scores: {
      VIS: {
        value: 8.5,
        note: "Same scroll-based visual logic with sensational graphic hell imagery driving curiosity and commerce.",
      },
      AUD: {
        value: 8,
        note: "Theatrical voice-acting for characters plus gongs bells and lutes—richer sound design than monastic chant.",
      },
      EMB: {
        value: 3,
        note: "Mostly passive viewing in a loose circle; coin payment and commercial exchange add social participation.",
      },
      LIV: {
        value: 8,
        note: "Pop-up itinerant gatherings at crossroads and markets—each performance ephemeral and mobile.",
      },
      SEM: {
        value: 6,
        note: "Hybrid shifted toward iconic spectacle and entertainment with commercial rather than doctrinal verbal framing.",
      },
      MAT: {
        value: 7.5,
        note: "Still a material scroll but portable paper/cloth rather than monumental temple hangings.",
      },
      RAU: {
        value: 4,
        note: "Cliffhanger pauses gate narrative continuation—performance even more essential to complete the experience.",
      },
      TMP: {
        value: 7.5,
        note: "Sequential revelation plus deliberate temporal withholding at cliffhangers for payment—stronger performer-controlled pacing.",
      },
    },
  },
];

async function main() {
  const traits = await prisma.traitDefinition.findMany();
  const byCode = Object.fromEntries(traits.map((t) => [t.code, t]));
  for (const code of ["VIS", "AUD", "EMB", "LIV", "SEM", "MAT", "RAU", "TMP"] as const) {
    if (!byCode[code]) throw new Error(`Missing trait definition: ${code}`);
  }

  for (const form of FORMS) {
    const slug = makeSlug(form.name);
    const existing = await prisma.mediaForm.findUnique({ where: { slug } });
    if (existing) {
      console.log(`Skip (exists): ${form.name} (${slug})`);
      continue;
    }

    await prisma.mediaForm.create({
      data: {
        name: form.name,
        slug,
        description: form.description,
        fixedTraits: {
          create: (Object.keys(form.scores) as TraitCode[]).map((code) => ({
            traitId: byCode[code].id,
            value: form.scores[code].value,
            note: form.scores[code].note,
          })),
        },
      },
    });
    console.log(`Created: ${form.name} (${slug})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
