# Route Tree

💪 &nbsp; Fully written in TypeScript\
🌲 &nbsp; Composition support with splitted trees\
🚀 &nbsp; Works anywhere\
🫕 &nbsp; Zero dependencies\
🪶 &nbsp; Lightweight (gzip: 1.38 KiB)

## Requirements:

```
Typescript 4.7+
```

## Installation

Install package:

```
npm install @mc-petry/route-tree
```

Construct routes:

```ts
// Create builder
const builder = routeBuilder(options)

// Create tree
const tree = builder.tree({
  user: segment({
    children: {
      id: param(),
    },
  }),
})

// Build routes
const routes = builder.build(tree)
```

Use it anywhere:

```ts
routes.user.$.route() // `/home`
routes.users.id.$.route({ id: 'John' }) // `/users/John`

routes.users.id.$.path // `:id`
routes.users.id.$.pattern // `/users/:id`
```

## Configuration

```ts
interface RouteBuilderConfig {
  /**
   * Global routes prefix.
   * @default '/'
   */
  basePath?: string

  /**
   * Use trailing slash on routes
   * @default false
   */
  trailingSlash?: boolean
}
```

## Helpers

```ts
/**
 * Returns route that match specified pathname.
 */
routes.$.find(pathname: string, options?: { depth?: number }): Route | null
```

## Routes meta

```ts
const routes = builder.build(
  builder.tree({
    home: segment({
      meta: { hidden: true },
    }),
  })
)

// Example usage
routes.home.$.meta.hidden === true
```

## Splitted trees

```ts
const home = builder.tree(...)
const users = builder.tree(...)

const routes = builder.build({
  ...home,
  ...users
})
```

## Types params

```ts
builder.tree({
  color: segment({
    id: param().setType<'grey' | 'yellow'>(),
  }),
})
```
