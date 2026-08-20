#!/usr/bin/env node
// Converts the legacy al-folio _bibliography/*.bib files (snapshotted here in
// scripts/bib-source/) into the typed src/data/publications.ts array used by
// the Astro site. Re-run with `node scripts/convert-bib.mjs` after editing
// scripts/bib-source/*.bib if the publication list changes.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, 'bib-source');
const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'publications.ts');

// file -> { category, topics }
const FILE_META = {
  // byType splits refereed journal articles from conference proceedings.
  'papers.bib': {
    category: 'paper',
    topics: ['collective-behavior', 'decision-making'],
    byType: { article: 'journal' },
  },
  'talks.bib': { category: 'talk', topics: ['collective-behavior', 'llm'] },
  'workshop.bib': { category: 'workshop', topics: ['decision-making', 'llm'] },
  'preprint.bib': { category: 'preprint', topics: ['collective-behavior', 'llm'] },
  'japan.bib': { category: 'domestic', topics: ['decision-making'] },
  'dissertation.bib': { category: 'thesis', topics: ['decision-making'] },
  'grant.bib': { category: 'grant', topics: ['music-cognition'] },
};

// Featured/carousel picks (by title substring) — kept in sync with the
// ProjectCarousel featured selection described in the redesign plan.
const SELECTED_TITLES = [
  /Trends and Visualization of Team Performance During Clutch Time/i,
  /Dynamics of Collective Creativity in Human-AI Hybrid Societies/i,
  /Mutual Adaptation of Large Language Models and Emergent Decision-Making/i,
  /Reducing Discomfort by Integrating Unpleasant Environmental Sounds/i,
];

// Per-entry topic overrides (by title substring) so the auto-tagging above
// is refined for entries whose subject differs from the file's default.
const TOPIC_OVERRIDES = [
  [/クラッチ|B\.League|Bリーグ|ハーフイニング|スポーツ/i, ['sports-analytics']],
  [/ソーシャルネットワーク|Human-AI|Collective Creativity|創造的伝播|創造性/i, ['collective-behavior', 'llm']],
  [/音|Sound|Noise|マスキング|自己効力感/i, ['music-cognition']],
  [/大規模言語モデル|LLM|Large Language Model/i, ['llm', 'decision-making']],
  [/KAWAI FOUNDATION/i, ['music-cognition']],
];

function splitTopLevelEntries(bibText) {
  const entries = [];
  const re = /@(\w+)\s*\{/g;
  let match;
  while ((match = re.exec(bibText))) {
    const type = match[1].toLowerCase();
    if (type === 'string') continue;
    const start = re.lastIndex; // just after the opening '{'
    let depth = 1;
    let i = start;
    while (depth > 0 && i < bibText.length) {
      if (bibText[i] === '{') depth++;
      else if (bibText[i] === '}') depth--;
      i++;
    }
    const body = bibText.slice(start, i - 1);
    entries.push({ type, body });
  }
  return entries;
}

function parseFields(body) {
  // body = "key,\n  field={value},\n  field2={value2}, ..."
  const firstComma = body.indexOf(',');
  const citeKey = body.slice(0, firstComma).trim();
  const rest = body.slice(firstComma + 1);
  const fields = {};
  let i = 0;
  while (i < rest.length) {
    while (i < rest.length && /[\s,]/.test(rest[i])) i++;
    if (i >= rest.length) break;
    const nameMatch = /^[a-zA-Z_]+/.exec(rest.slice(i));
    if (!nameMatch) break;
    const name = nameMatch[0].toLowerCase();
    i += name.length;
    while (i < rest.length && /[\s=]/.test(rest[i])) i++;
    let value = '';
    if (rest[i] === '{') {
      let depth = 1;
      i++;
      const start = i;
      while (depth > 0 && i < rest.length) {
        if (rest[i] === '{') depth++;
        else if (rest[i] === '}') depth--;
        i++;
      }
      value = rest.slice(start, i - 1);
    } else if (rest[i] === '"') {
      i++;
      const start = i;
      while (i < rest.length && rest[i] !== '"') i++;
      value = rest.slice(start, i);
      i++;
    } else {
      const start = i;
      while (i < rest.length && rest[i] !== ',') i++;
      value = rest.slice(start, i);
    }
    fields[name] = value.trim();
  }
  return { citeKey, fields };
}

function splitAuthors(authorField) {
  if (!authorField) return [];
  return authorField.split(/\s+and\s+/).map((a) => {
    a = a.trim();
    // Convert "Last, First" -> "First Last"
    if (a.includes(',')) {
      const [last, first] = a.split(',').map((s) => s.trim());
      return `${first} ${last}`;
    }
    return a;
  });
}

function pickYear(fields) {
  const y = parseInt(fields.year, 10);
  return Number.isFinite(y) ? y : 0;
}

function pickTopics(defaultTopics, title) {
  for (const [re, topics] of TOPIC_OVERRIDES) {
    if (re.test(title)) return Array.from(new Set([...topics]));
  }
  return defaultTopics;
}

function buildLinks(fields) {
  const links = {};
  if (fields.doi) links.doi = `https://doi.org/${fields.doi}`;
  if (fields.url) links.url = fields.url.replace(/\\/g, '').trim();
  if (fields.html) links.url = links.url ?? fields.html;
  return links;
}

function main() {
  const files = readdirSync(SRC_DIR).filter((f) => f.endsWith('.bib'));
  const out = [];
  let idCounter = 1;

  for (const file of files) {
    const meta = FILE_META[file] ?? { category: 'paper', topics: ['decision-making'] };
    const text = readFileSync(path.join(SRC_DIR, file), 'utf8');
    const entries = splitTopLevelEntries(text);

    for (const { type, body } of entries) {
      const { citeKey, fields } = parseFields(body);
      const title = (fields.title ?? '').replace(/[{}]/g, '').trim();
      if (!title) continue;
      const authors = splitAuthors(fields.author);
      const venue = fields.booktitle ?? fields.journal ?? fields.note ?? '';
      const category =
        type === 'phdthesis' && file === 'grant.bib'
          ? 'grant'
          : type === 'phdthesis'
            ? 'thesis'
            : (meta.byType?.[type] ?? meta.category);

      const entry = {
        id: `${citeKey}-${idCounter++}`,
        title,
        authors,
        venue: venue.replace(/[{}]/g, '').trim(),
        year: pickYear(fields),
        category,
        topics: pickTopics(meta.topics, title),
        links: buildLinks(fields),
      };
      if (SELECTED_TITLES.some((re) => re.test(title))) {
        entry.selected = true;
      }
      out.push(entry);
    }
  }

  // Newest first within the generated list; page-level grouping happens by category.
  out.sort((a, b) => b.year - a.year);

  const header = `// AUTO-GENERATED by scripts/convert-bib.mjs from scripts/bib-source/*.bib.
// Do not hand-edit entries here except for small corrections; re-run the
// script after updating the source .bib files to regenerate from scratch.

export type PublicationCategory =
  | "journal"
  | "paper"
  | "talk"
  | "workshop"
  | "preprint"
  | "domestic"
  | "thesis"
  | "grant";

export type Topic =
  | "decision-making"
  | "collective-behavior"
  | "music-cognition"
  | "sports-analytics"
  | "llm";

export interface PublicationLinks {
  pdf?: string;
  doi?: string;
  url?: string;
}

export interface Publication {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
  category: PublicationCategory;
  topics: Topic[];
  links: PublicationLinks;
  preview?: string;
  selected?: boolean;
}

export const publications: Publication[] = `;

  const body = JSON.stringify(out, null, 2)
    // drop quotes around already-valid identifier-like keys isn't necessary; keep valid TS via JSON.
    .replace(/"(\w+)":/g, '$1:');

  writeFileSync(OUT_FILE, `${header}${body};\n`);
  console.log(`Wrote ${out.length} publications to ${OUT_FILE}`);
}

main();
