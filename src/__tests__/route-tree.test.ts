import { routeBuilder } from '..'

describe('Generation', () => {
  const builder = routeBuilder()

  const tree = builder.tree(({ path, param }) => ({
    categories: path({
      children: {
        category: param({
          children: {
            movies: path({
              children: {
                movie: param({
                  children: {
                    details: path(),
                  },
                }),
              },
            }),
          },
        }),
      },
    }),
    someRoute: path({
      children: {
        nestRoute: path(),
      },
    }),
    customPath: path({
      path: 'renamed',
      children: {
        nest: param(),
      },
    }),
  }))

  const routes = builder.build(tree)

  test('Parameters', () => {
    expect(routes.categories.category.movies.movie.details.$.route({ category: 'comedy', movie: '1' })).toBe(
      `/categories/comedy/movies/1/details`
    )

    expect(routes.$.route()).toBe(`/`)
    expect(routes.categories.category.$.route({ category: 'horror' })).toBe(`/categories/horror`)
  })

  test('pascalCase to dash-case path', () => {
    expect(routes.someRoute.$.route()).toBe(`/some-route`)
    expect(routes.someRoute.nestRoute.$.route()).toBe(`/some-route/nest-route`)
  })

  test('Pattern & custom path', () => {
    expect(routes.categories.category.movies.movie.$.path).toBe(`:movie`)
    expect(routes.categories.category.movies.movie.$.pattern).toBe(`/categories/:category/movies/:movie`)
    expect(routes.customPath.nest.$.pattern).toBe(`/renamed/:nest`)
  })
})

describe('Advanced', () => {
  const builder = routeBuilder({
    basePath: '/personal',
  })

  test('Splitted subtrees', () => {
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

  test('Children', () => {
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

  test('Meta', () => {
    const routes = builder.build(
      builder.tree(({ path: route }) => ({
        home: route({
          meta: { theme: 'light' },
          children: {
            projects: route({
              meta: { visible: false },
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
  })

  test('Find child', () => {
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
    expect(routes.$.find('/personal/users/1/comments', { depth: 0 })).toBe(routes.$)
    expect(routes.$.find('/personal/users/1/comments', { depth: 1 })).toBe(routes.users.$)
    expect(routes.$.find('/personal/users/1/comments', { depth: 2 })).toBe(routes.users.id.$)
    expect(routes.$.find('/personal/users/1/comments', { depth: 3 })).toBe(routes.users.id.comments.$)
  })

  test('Trailing slash', () => {
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
