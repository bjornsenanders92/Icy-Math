const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('.'));

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Cache for generated questions
const questionCache = {};
const cacheFile = path.join(__dirname, 'question-cache.json');
const stats = { totalGenerated: 0, cacheHits: 0, apiCalls: 0 };

// Load cache from file
function loadCache() {
  try {
    if (fs.existsSync(cacheFile)) {
      const data = fs.readFileSync(cacheFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.log('Cache file not found, starting fresh');
  }
  return {};
}

// Save cache to file
function saveCache() {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(questionCache, null, 2));
  } catch (e) {
    console.error('Error saving cache:', e);
  }
}

Object.assign(questionCache, loadCache());

const CATEGORIES = {
  prosent: 'Prosentregning (prosenter, rabatter, økning, nedgang, rente)',
  mult: 'Multiplikasjon og divisjon (hele tall, desimaltall)',
  tid: 'Tidsregning (timer, minutter, sekunder, klokkeslett, dato, varighet)',
  handel: 'Handel & penger (kjøp, pris, beregninger, rabattp, enhetspris)',
  areal: 'Areal & mål (omkrets, areal, flater, volum)',
  hode: 'Hoderegning (enkle beregninger, potenser, røtter)',
  stat: 'Statistikk (snitt, median, modus, sannsynlighet, terning, mynter)',
  geom: 'Geometri (former, vinkler, symmetri, transformasjoner)',
  potens: 'Potenser & røtter (kvadrattall, kubikktall, kvadratrot)',
  brøk: 'Brøker (addisjon, subtraksjon, multiplikasjon, deling av brøker)'
};

const DIFFICULTY_GUIDES = {
  1: {
    desc: 'Lett (d:1) - for 12-åring, ~5 minutter',
    rules: 'Enkle oppgaver. Små tall (under 100). Grunnleggende operasjoner. Åpenbare samle-henger. Ja/Nei eller valg fra 4 alternativer.'
  },
  2: {
    desc: 'Middels (d:2) - for 12-åring, ~7 minutter, litt vanskeligere',
    rules: 'Moderat oppgaver. Tall opp til 1000. Kombinerer 2-3 operasjoner. Trenger tankearbeid. Noen desimaltall.'
  },
  3: {
    desc: 'Vanskelig (d:3) - for 12-åring, ~10 minutter, mye vanskeligere',
    rules: 'Utfordrende oppgaver. Tall opp til 10 000+. Kombinerer flere konsepter. Krever problemløsning. Desimaltall og prosenter.'
  }
};

async function generateQuestion(category, difficulty) {
  const cacheKey = `${category}-${difficulty}`;

  // Check cache first
  if (questionCache[cacheKey] && questionCache[cacheKey].length > 0) {
    // Return random cached question and remove it
    const idx = Math.floor(Math.random() * questionCache[cacheKey].length);
    const question = questionCache[cacheKey][idx];
    questionCache[cacheKey].splice(idx, 1);
    stats.cacheHits++;

    // Replenish cache if running low
    if (questionCache[cacheKey].length < 5) {
      generateAndCacheQuestions(category, difficulty).catch(e =>
        console.error(`Background cache replenish failed: ${e.message}`)
      );
    }

    return question;
  }

  // Generate new questions if cache is empty
  await generateAndCacheQuestions(category, difficulty);

  if (questionCache[cacheKey] && questionCache[cacheKey].length > 0) {
    const question = questionCache[cacheKey].shift();
    return question;
  }

  // Fallback if generation failed
  return {
    q: 'Feil ved spørsmålsgenerering. Prøv igjen!',
    a: ['OK', 'OK', 'OK', 'OK'],
    c: 0
  };
}

async function generateAndCacheQuestions(category, difficulty) {
  const cacheKey = `${category}-${difficulty}`;
  if (!questionCache[cacheKey]) {
    questionCache[cacheKey] = [];
  }

  const diffGuide = DIFFICULTY_GUIDES[difficulty];
  console.log(`[AI] Generating 8 questions for ${category} (d:${difficulty})...`);

  const prompt = `Du er en mattematikklærer som lager oppgaver for norske 12-åringer.

KATEGORI: ${CATEGORIES[category]}
VANSKELIGHETSGRAD: ${diffGuide.desc}

REGLER FOR OPPGAVENE:
${diffGuide.rules}

Du skal lage NØYAKTIG 8 ULIKE og VARIERTE oppgaver som:
- Er på norsk
- Har 4 svaralternativer (1 riktig, 3 plausible gale)
- Veksler mellom ulike typer oppgaver innenfor kategorien
- Bruker realistiske tall og kontekster
- Ikke gjentar samme oppgavetype

FORMAT (BARE JSON, INGEN TEKST):
[
  {"q":"spørsmål her?","a":["svar1","svar2","svar3","svar4"],"c":0},
  {"q":"neste spørsmål?","a":["a","b","c","d"],"c":2}
]

VIKTIG: "c" = index av riktig svar (0-3). Første svar = "c":0, fjerde svar = "c":3

Svar BARE med JSON-arrayen, inga annen tekst!`;

  try {
    stats.apiCalls++;
    const message = await client.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const questions = JSON.parse(jsonMatch[0]);

    // Validate questions
    const validQuestions = questions.filter(q =>
      q.q && Array.isArray(q.a) && q.a.length === 4 &&
      typeof q.c === 'number' && q.c >= 0 && q.c < 4
    );

    if (validQuestions.length === 0) {
      throw new Error('No valid questions in response');
    }

    questionCache[cacheKey].push(...validQuestions);
    stats.totalGenerated += validQuestions.length;
    saveCache();
    console.log(`✓ Generated ${validQuestions.length} questions for ${category} (d:${difficulty})`);
  } catch (e) {
    console.error(`✗ Error generating questions: ${e.message}`);
    // Add a dummy question so game doesn't crash
    questionCache[cacheKey].push({
      q: 'Spørsmål kunne ikke genereres. Sjekk API-nøkkel!',
      a: ['OK', 'Retry', 'OK', 'OK'],
      c: 0
    });
  }
}

// Pre-generate questions for all categories/difficulties on startup
async function warmupCache() {
  console.log('\n[WARMUP] Pre-generating questions for faster gameplay...');
  const categories = Object.keys(CATEGORIES);

  for (const cat of categories) {
    for (let d = 1; d <= 3; d++) {
      const cacheKey = `${cat}-${d}`;
      if (!questionCache[cacheKey] || questionCache[cacheKey].length === 0) {
        try {
          await generateAndCacheQuestions(cat, d);
          // Stagger requests to avoid rate limiting
          await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          console.error(`Failed to warmup ${cat}-${d}: ${e.message}`);
        }
      }
    }
  }
  console.log('[WARMUP] Cache warmed up!\n');
}

// API endpoint for getting a question
app.get('/api/question', async (req, res) => {
  const { category = 'prosent', difficulty = 1, debug = false } = req.query;

  if (!CATEGORIES[category]) {
    return res.status(400).json({ error: 'Invalid category', valid: Object.keys(CATEGORIES) });
  }

  const diff = parseInt(difficulty);
  if (![1, 2, 3].includes(diff)) {
    return res.status(400).json({ error: 'Invalid difficulty (must be 1-3)' });
  }

  try {
    const question = await generateQuestion(category, diff);

    if (debug) {
      question._debug = {
        category,
        difficulty: diff,
        cacheSize: questionCache[`${category}-${diff}`]?.length || 0
      };
    }

    res.json(question);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API endpoint for cache status and stats
app.get('/api/cache-status', (req, res) => {
  const status = {};
  for (const cat in CATEGORIES) {
    status[cat] = {};
    for (let d = 1; d <= 3; d++) {
      const key = `${cat}-${d}`;
      status[cat][d] = questionCache[key]?.length || 0;
    }
  }
  res.json({
    categories: status,
    stats: {
      totalGenerated: stats.totalGenerated,
      cacheHits: stats.cacheHits,
      apiCalls: stats.apiCalls,
      totalCached: Object.values(questionCache).reduce((sum, arr) => sum + arr.length, 0)
    }
  });
});

// API endpoint for health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    apiKey: !!process.env.ANTHROPIC_API_KEY,
    categories: Object.keys(CATEGORIES).length,
    stats
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🎮 IcyMath AI Question Generator`);
  console.log(`📍 Running on http://localhost:${PORT}/mathtower.html`);
  console.log(`📚 Categories: ${Object.keys(CATEGORIES).length}`);
  console.log(`🔑 API Key: ${process.env.ANTHROPIC_API_KEY ? '✓ Set' : '✗ Missing'}\n`);

  // Warmup cache
  if (process.env.ANTHROPIC_API_KEY) {
    warmupCache();
  }
});
