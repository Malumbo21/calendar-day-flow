# website-new

This is a Next.js application generated with
[Create Fumadocs](https://github.com/fuma-nama/fumadocs).

Run development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open http://localhost:3000 with your browser to see the result.

### Why `dev` runs with `--disable-source-maps`

Some docs pages compile to very large modules (`appointment-schedule.mdx` and
`content-slots.mdx` are over 1 MB of generated JSX each). In dev, React attaches
the module's **entire** source map — inlined as a base64 `data:` URL — to every
server-component stack frame it reconstructs, and Node keeps each one in its
source-map cache. On these pages that is a few MB per frame across hundreds of
frames, which took ~50 s per request and exhausted the V8 heap after two or
three page loads (`FATAL ERROR: Reached heap limit`).

`--disable-source-maps` removes the inlined maps: the same pages render in
about a second and the dev server stays around 1 GB. The cost is that
server-side stack traces in dev point at compiled output instead of the
original source — run `npm run dev:source-maps` when you need them, and prefer
a narrow page to debug on.

## Explore

In the project, you can see:

- `lib/source.ts`: Code for content source adapter, [`loader()`](https://fumadocs.dev/docs/headless/source-api) provides the interface to access your content.
- `lib/layout.shared.tsx`: Shared options for layouts, optional but preferred to keep.

| Route                     | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `app/(home)`              | The route group for your landing page and other pages. |
| `app/docs`                | The documentation layout and pages.                    |
| `app/api/search/route.ts` | The Route Handler for search.                          |

### Fumadocs MDX

A `source.config.ts` config file has been included, you can customise different options like frontmatter schema.

Read the [Introduction](https://fumadocs.dev/docs/mdx) for further details.

## Learn More

To learn more about Next.js and Fumadocs, take a look at the following
resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Fumadocs](https://fumadocs.dev) - learn about Fumadocs
