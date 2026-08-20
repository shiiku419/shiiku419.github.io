# shiiku419.github.io

Personal research portfolio for Shota Shiiku (椎久翔太) — cognitive-science
researcher and software engineer. Built with Astro, React islands, and
Tailwind CSS; deployed as a fully static site to GitHub Pages.

## Stack

- [Astro](https://astro.build) (`output: 'static'`) with [@astrojs/react](https://docs.astro.build/en/guides/integrations-guide/react/) islands
- Tailwind CSS v4 via `@tailwindcss/vite`
- Self-hosted fonts: Inter (variable) + Noto Sans JP via `@fontsource*`
- `@astrojs/sitemap`
- Deployed via `withastro/action` → `actions/deploy-pages` (`.github/workflows/deploy.yml`)

## Structure

```
src/
  components/         Astro components (Sidebar, PublicationCard, NewsItem, ...)
  components/react/   React islands (OrbitHero, InterestFilter, ProjectCarousel)
  data/                topics.ts, publications.ts, news.ts
  layouts/Layout.astro
  pages/               index, about, publications, news, cv
public/                static assets (prof photo, CV PDF, publication previews)
scripts/convert-bib.mjs   regenerates src/data/publications.ts from scripts/bib-source/*.bib
```

## Commands

| Command        | Action                                      |
| -------------- | -------------------------------------------- |
| `pnpm install` | Install dependencies                         |
| `pnpm dev`     | Start local dev server at `localhost:4321`   |
| `pnpm build`   | Build the static site to `./dist/`           |
| `pnpm preview` | Preview the production build locally         |

To update publications after editing a `.bib` file in `scripts/bib-source/`,
re-run:

```sh
node scripts/convert-bib.mjs
```

This regenerates `src/data/publications.ts` from scratch (topic overrides and
featured/"selected" picks are re-applied automatically).
