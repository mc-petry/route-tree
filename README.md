# menu-system

Powerful and simple tool to build a complex menu tree.\
Use it with TypeScript for full intellisense.

# Usage

Construct menu:

```ts
// Create builder
const builder = createMenuBuilder()

// Create tree
const tree = factory.tree(({ route }) => ({
  home: route(),
  users: route({
    children: {
      id: arg({
        comments: route()
      })
    }
  })
}))

// Build tree
const menu = builder.build(tree)
```

Use it anywhere:

```ts
menu.routes.home._.fullpath() // '/home'
menu.routes.users.id._.fullpath({ id: '1' }) // '/users/1'
menu.routes.users.id.comments._.fullpath({ id: 'mc-petry' }) // '/users/mc-petry/comments'
```

## Advanced

### Find route

```ts
/**
 * Returns route that match specified location.
 * Otherwise returns null
 */
menu.findRoute(location: string, maxLevel?: number): Route | null
```

### Base path

```ts
createMenuBuilder({ basePath: '/local' })
```

### Routes meta

```ts
const menu = builder.build(
  builder.tree(({ route }) => ({
    home: route({
      meta: {
        hidden: true
      }
    }),
    about: route({
      meta: {
        hidden: false
      }
    })
  }))
)

// Example usage
menu.routes._.children.filter(route => !route.meta.hidden)
```

### Split trees

```ts
const homeTree = builder.tree(...)
const usersTree = builder.tree(...)

const menu = builder.build({
  ...homeTree,
  ...usersTree
})
```

## Compatibility

All modern environments.\
IE 11 requires polyfills: `String.startsWith()`

# Development

## Publishing

`npm run build`
`npm publish dist`