# route-tree

Powerful and simple tool to build a complex route tree.

# Usage

Construct menu:

```ts
// Create builder
const builder = routeBuilder(options)

// Create tree
const tree = builder.tree(({ route, arg }) => ({
  home: route(),
  users: route({
    children: {
      id: arg({
        children: {
          comments: route(),
        },
      }),
    },
  }),
}))

// Build routes
const routes = builder.build(tree)
```

Use it anywhere:

```ts
routes.home.$.fullpath() // `/home`
routes.users.id.$.fullpath({ id: '1' }) // `/users/1`
routes.users.id.comments.$.fullpath({ id: 'mc-petry' }) // `/users/mc-petry/comments`
```

Compatible with react-router:

```ts
routes.users.id.$.path // `:id`
routes.users.id.$.pattern // `/users/:id`
```

## Configuration

```ts
interface RouteTreeConfig {
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
const menu = builder.build(
  builder.tree(({ route }) => ({
    home: route({
      meta: {
        hidden: true,
      },
    }),
    about: route({
      meta: {
        hidden: false,
      },
    }),
  }))
)

// Example usage
menu.routes._.children.filter(route => !route.meta.hidden)
```

## Split trees

```ts
const homeTree = builder.tree(...)
const usersTree = builder.tree(...)

const menu = builder.build({
  ...homeTree,
  ...usersTree
})
```
