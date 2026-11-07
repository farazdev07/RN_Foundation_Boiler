# 0001. Trimmed Feature-Sliced Design, enforced by lint

- Status: Accepted
- Date: 2026-11-04

## Context

The previous boilerplate (RN_Arch) grouped code by kind (`components/`, `hooks/`, `store/`), so a feature was
spread over many folders and anything could import anything. The ProductCatalog case study grouped by feature,
but its features imported each other. That created a cycle, and `FavoritesScreen` had to move into `app/` to
break it.

## Decision

Use five layers under `src/`: `app → screens → features → entities → shared`.

- A layer imports only from the layers below it.
- Slices on the same layer never import each other.
- A slice is imported only through its `index.ts`.

`eslint-plugin-boundaries` enforces this, in the pre-commit hook and in CI. Violating fixtures in
`tools/boundary-fixtures/` prove each rule still fires, by exact rule ID.

This is a trimmed version of Feature-Sliced Design. `pages` is called `screens`, which is the React Native term.
There are no `widgets` or `processes` layers, because nothing here needs them yet. Entities are strict, with no
`@x` cross-imports; one is added only when a real case needs it.

## Consequences

- The case-study cycle cannot happen. When two slices need each other, the layer above composes them. For example,
  the products screen passes `FavoriteButton` into `ProductCard`'s `action` slot.
- Entities and features take callbacks instead of navigating, so they work under any navigator and are easy to
  test.
- There is some ceremony: an `index.ts` per slice, and occasionally a slot or callback where a direct import would
  be shorter.

## Alternatives

- **Feature folders without layer rules** (the case study). Simple, but nothing stops the import cycles that hurt
  it.
- **Full Feature-Sliced Design.** `widgets` and `processes` add layers with no current use.
- **Monorepo packages per feature.** Real isolation, but a lot of build and tooling weight for one app.
