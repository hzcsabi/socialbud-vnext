# UI components (shadcn/ui)

Components in this folder follow the [shadcn/ui](https://ui.shadcn.com) pattern: copy-paste, Tailwind + Radix, with `cn()` from `@/lib/utils` for class merging.

**Included:** Button, Input, Card.

**Add more:** From `apps/web`, run:

```bash
cd apps/web && pnpm exec shadcn@latest add dialog
pnpm exec shadcn@latest add sheet
# etc.
```

Or copy components from the [shadcn docs](https://ui.shadcn.com/docs/components) and place them here. `components.json` is in `apps/web` for the CLI.

**Text truncation:** Use Tailwind’s built-in `line-clamp-1`, `line-clamp-2`, etc. (no extra plugin).

**Prose (markdown/long-form):** Use the `prose` class from `@tailwindcss/typography` on a wrapper element.
