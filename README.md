# menu-system

Powerful and simple tool to build complex menu tree.
Use it with TypeScript for full intellisense.

# Usage

## Simple

Construct menu:

```ts
// Create builder
const builder = createMenuBuilder()

// Create tree
const tree = factory.tree(({ route }) => ({
  home: route(),
  users: route({
    children: {
      id: arg()
    }
  })
}))

// Build tree
const menu = builder.build(tree)
```

Use it:

```ts
menu.routes.home._.fullpath() // '/home'
menu.routes.users.id._.fullpath({ id: '1' }) // '/users/1'
```

## Advanced

### Base path

```ts
createMenuBuilder({ basePath: '/local' })
```

### Routes meta

```ts
interface MyMeta {
  hidden?: boolean
}

const builder = createMenuBuilder<MyMeta>()

builder.tree(({ route }) => ({
  home: route({
    meta: {
      hidden: true
    }
  })
}))
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