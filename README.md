# Sky254 Electronics

Online store for Sky254 Electronics, Nairobi. Built with Next.js (App Router), TypeScript and Tailwind CSS.

Design: https://claude.ai/artifact/GhDq32943xiNFZnvDwUb6r

## Getting started

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Commands

| Command         | What it does                     |
| --------------- | -------------------------------- |
| `npm run dev`   | Start the development server     |
| `npm run build` | Create a production build        |
| `npm start`     | Serve the production build       |
| `npm run lint`  | Check the code with ESLint       |

## Where things live

- `src/app/` holds pages and the root layout.
- `src/app/globals.css` holds the brand colours and font tokens. Use them as Tailwind classes such as `bg-brand`, `text-ink` or `border-line`.
- `src/lib/supabase/` holds the Supabase connection helpers.
- `src/lib/storage.ts` compresses photos to WebP before upload and builds their public URLs.
- `supabase/migrations/` holds the database scripts. Run them in the Supabase SQL Editor.

## Environment variables

Copy `.env.example` to `.env.local` and add your Supabase keys.

## Catalogue data

Products live in Supabase, and photos live in the `products` Storage bucket as `<product-slug>/product.webp` (the product on its own) and `<product-slug>/box.webp` (in its box or in the shop).

`npm run seed` loads `supabase/seed/catalog.json` and the compressed photos in `supabase/seed/images/`. The photos aren't in Git, so this only works on a machine that has them. It's safe to re-run: products already in the database keep their current details, but photos are re-uploaded.

## Admin dashboard

The dashboard is at `/admin`. To give someone access, run:

```bash
npm run create-admin -- their@email.com
```

New accounts get a temporary password, shown once in the terminal. Change it under Account after signing in.

Access is checked on every admin page and action, and the database enforces it too (`supabase/migrations`). Photos uploaded in the dashboard are compressed to WebP in the browser before they're stored.

## Before launch

Some product photos came from retailer and manufacturer websites and are placeholders for development. Replace them with images you have permission to use, such as official images from your distributors.
