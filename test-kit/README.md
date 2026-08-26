# test-kit

Shared test source for the framework adapters. Not a package, not published —
each adapter's test runner aliases `@test-kit` (and `@dayflow/core`) here.

Every framework adapter (`@dayflow/react`, `@dayflow/vue`, `@dayflow/angular`,
`@dayflow/svelte`) does the same job: keep a framework renderer in sync with the
core's `CustomRenderingStore`, and portal user content into the placeholder
`<div>`s the core registers.

That job is one contract, so it gets one test kit:

- **`fakeCore`** — a stand-in for `@dayflow/core`. It keeps the _real_
  `CustomRenderingStore` (registration and notification semantics are the thing
  under test) and replaces only the Preact render with a controllable renderer
  that registers one placeholder per overridden slot. Every observable step is
  appended to `lifecycleLog`.
- **`contract`** — assertions phrased against that log, so all four adapters are
  held to the same ordering rules.

## The rules

1. **Subscribe before mount.** `mount()` registers placeholders synchronously.
   Subscribing afterwards means those registrations land before anyone is
   listening, and the adapter only catches up on a later commit — one blank
   frame.
2. **Unsubscribe before unmount.** `unmount()` unregisters every slot, which
   notifies the store. If the adapter is still listening it clears its portal
   list to empty and the user sees custom content vanish.
3. **Never hold an empty map after mount.** Any empty state must be superseded
   within the same synchronous block, or it reaches the screen.

Rule 2 is the one that produced the `titleBarSlot` flicker; rules 1 and 3 are
the invariants that keep it fixed.

## Wiring

Jest (`react`, `vue`, `angular`) maps both specifiers in `moduleNameMapper`;
Vitest (`svelte`) does the same through `resolve.alias`. There is no workspace
package and no dependency entry — the runner alias is what resolves it.

Type-checked by the root `pnpm typecheck`, which runs
`tsc -p test-kit/tsconfig.json` after the workspace package checks.
