import { routeBuilder } from '..'

describe('Advanced', () => {
  const builder = routeBuilder({
    basePath: '/personal',
  })

  it('Splitted subtrees', () => {
    const articlesTree = builder.tree(({ path: route, param: arg }) => ({
      article: route({
        children: {
          id: arg(),
        },
      }),
    }))

    const usersTree = builder.tree(({ path: route, param: arg }) => ({
      users: route({
        children: {
          id: arg({
            children: {
              topics: route(),
              comments: route(),
            },
          }),
        },
      }),
    }))

    const menu = builder.build({
      ...articlesTree,
      ...usersTree,
    })

    expect(menu.article.id.$.route({ id: '25' })).toBe(`/personal/article/25`)
    expect(menu.users.id.comments.$.route({ id: '1' })).toBe(`/personal/users/1/comments`)
  })

  it('Children', () => {
    const routes = builder.build(
      builder.tree(({ path: route, param: arg }) => ({
        articles: route({
          children: {
            id: arg({
              children: {
                comments: route(),
                claps: route(),
              },
            }),
          },
        }),
        users: route(),
      }))
    )

    expect(routes.$.children.length).toBe(2)
    expect(routes.articles.id.$.children[0]).toBe(routes.articles.id.comments.$)
    expect(routes.articles.id.$.children[0].route({ id: 'article' })).toBe('/personal/articles/article/comments')
    expect(routes.articles.id.$.children[1].route({ id: 'article' })).toBe('/personal/articles/article/claps')
  })

  it('Meta', () => {
    const routes = builder.build(
      builder.tree(({ path: route }) => ({
        home: route({
          meta: { theme: 'light' },
          children: {
            projects: route({
              meta: { visible: false },
              children: {
                shared: route({
                  meta: {
                    prop: '1',
                  },
                }),
                personal: route({
                  meta: {
                    prop: '2',
                  },
                }),
              },
            }),
          },
        }),
        about: route({
          meta: { theme: 'dark' },
        }),
      }))
    )

    // Direct meta
    expect(routes.home.$.meta.theme).toBe('light')
    expect(routes.about.$.meta.theme).toBe('dark')
    expect(routes.home.projects.$.meta.visible).toBeFalsy()

    // Children meta
    expect(routes.$.children[0].meta.theme).toBe('light')
    expect(routes.$.children[1].meta.theme).toBe('dark')
    expect(routes.home.projects.$.children[0].meta.prop).toBe('1')
    expect(routes.home.projects.$.children[1].meta.prop).toBe('2')
  })

  it('Find child', () => {
    const simpleBuilder = routeBuilder()
    const simpleRoutes = simpleBuilder.build(
      simpleBuilder.tree(({ path: route }) => ({
        nodes: route(),
      }))
    )

    expect(simpleRoutes.$.find('/nodes')).toBe(simpleRoutes.nodes.$)

    const routes = builder.build(
      builder.tree(({ path: route, param: arg }) => ({
        users: route({
          children: {
            id: arg({
              children: {
                view: route(),
                comments: route(),
              },
            }),
          },
        }),
      }))
    )

    expect(routes.$.find('/personal')).toBe(routes.$)
    expect(routes.$.find('/personal/users')).toBe(routes.users.$)
    expect(routes.$.find('/personal/users/1')).toBe(routes.users.id.$)
    expect(routes.$.find('/personal/users/1/comments')).toBe(routes.users.id.comments.$)

    // Fake
    expect(routes.$.find('/personal/users/1/fake')).toBe(null)
    expect(routes.$.find('/personal/fake')).toBe(null)

    // Trailing slash
    expect(routes.$.find('/personal/')).toBe(routes.$)
    expect(routes.$.find('/personal/users/1/')).toBe(routes.users.id.$)

    // Max level
    expect(routes.$.find('/personal/users/1/comments', 0)).toBe(routes.$)
    expect(routes.$.find('/personal/users/1/comments', 1)).toBe(routes.users.$)
    expect(routes.$.find('/personal/users/1/comments', 2)).toBe(routes.users.id.$)
    expect(routes.$.find('/personal/users/1/comments', 3)).toBe(routes.users.id.comments.$)
  })

  it('Trailing slash', () => {
    const mb = routeBuilder({
      basePath: '/local',
      trailingSlash: true,
    })

    const menu = mb.build(
      mb.tree(({ path, param }) => ({
        users: path({
          children: {
            id: param({
              children: {
                rating: path(),
              },
            }),
          },
        }),
      }))
    )

    expect(menu.$.route()).toBe('/local/')
    expect(menu.users.$.route()).toBe('/local/users/')
    expect(menu.users.id.rating.$.route({ id: 5 })).toBe('/local/users/5/rating/')
  })
})
