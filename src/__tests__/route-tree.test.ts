import { param, Route, routeBuilder, Routes, segment } from '..'

describe('Generation', () => {
  const builder = routeBuilder()

  const tree = builder.tree({
    categories: segment({
      children: {
        category: param({
          children: {
            movies: segment({
              children: {
                movie: param({
                  children: {
                    details: segment(),
                  },
                }),
              },
            }),
          },
        }),
      },
    }),
    someRoute: segment({
      children: {
        nestRoute: segment(),
      },
    }),
    customPath: segment({
      path: 'renamed',
      children: {
        nest: param(),
      },
    }),
  })

  const routes = builder.build(tree)

  test('Parameters', () => {
    expect(
      routes.categories.category.movies.movie.details.$.route({
        category: 'comedy',
        movie: '1',
      })
    ).toBe(`/categories/comedy/movies/1/details`)

    expect(routes.$.route()).toBe(`/`)
    expect(routes.categories.category.$.route({ category: 'horror' })).toBe(
      `/categories/horror`
    )
  })

  test('pascalCase to dash-case path', () => {
    expect(routes.someRoute.$.route()).toBe(`/some-route`)
    expect(routes.someRoute.nestRoute.$.route()).toBe(`/some-route/nest-route`)
  })

  test('Pattern & custom path', () => {
    expect(routes.categories.category.movies.movie.$.path).toBe(`:movie`)
    expect(routes.categories.category.movies.movie.$.pattern).toBe(
      `/categories/:category/movies/:movie`
    )
    expect(routes.customPath.nest.$.pattern).toBe(`/renamed/:nest`)
  })
})

describe('Advanced', () => {
  const builder = routeBuilder({
    basePath: '/personal',
  })

  test('Splitted subtrees', () => {
    const articlesTree = builder.tree({
      article: segment({
        children: {
          id: param(),
        },
      }),
    })

    const usersTree = builder.tree({
      users: segment({
        children: {
          id: param({
            children: {
              topics: segment(),
              comments: segment(),
            },
          }),
        },
      }),
    })

    const menu = builder.build({
      ...articlesTree,
      ...usersTree,
    })

    expect(menu.article.id.$.route({ id: '25' })).toBe(`/personal/article/25`)
    expect(menu.users.id.comments.$.route({ id: '1' })).toBe(
      `/personal/users/1/comments`
    )
  })

  test('Children', () => {
    const routes = builder.build(
      builder.tree({
        articles: segment({
          children: {
            id: param({
              children: {
                comments: segment(),
                claps: segment(),
              },
            }),
          },
        }),
        users: segment(),
      })
    )

    expect(routes.$.children.length).toBe(2)
    expect(routes.articles.id.$.children[0]).toBe(routes.articles.id.comments.$)
    expect(routes.articles.id.$.children[0].route({ id: 'article' })).toBe(
      '/personal/articles/article/comments'
    )
    expect(routes.articles.id.$.children[1].route({ id: 'article' })).toBe(
      '/personal/articles/article/claps'
    )
  })

  test('Meta', () => {
    const routes = builder.build(
      builder.tree({
        home: segment({
          meta: { theme: 'light' },
          children: {
            projects: segment({
              meta: { visible: false },
            }),
          },
        }),
        about: segment({
          meta: { theme: 'dark' },
        }),
      })
    )

    // Direct meta
    expect(routes.home.$.meta.theme).toBe('light')
    expect(routes.about.$.meta.theme).toBe('dark')
    expect(routes.home.projects.$.meta.visible).toBeFalsy()
  })

  test('Find child', () => {
    const simpleBuilder = routeBuilder()
    const simpleRoutes = simpleBuilder.build(
      simpleBuilder.tree({
        nodes: segment(),
      })
    )

    expect(simpleRoutes.$.find('/nodes')).toBe(simpleRoutes.nodes.$)

    const routes = builder.build(
      builder.tree({
        users: segment({
          children: {
            id: param({
              children: {
                view: segment(),
                comments: segment(),
              },
            }),
          },
        }),
      })
    )

    expect(routes.$.find('/personal')).toBe(routes.$)
    expect(routes.$.find('/personal/users')).toBe(routes.users.$)
    expect(routes.$.find('/personal/users/1')).toBe(routes.users.id.$)
    expect(routes.$.find('/personal/users/1/comments')).toBe(
      routes.users.id.comments.$
    )

    // Fake
    expect(routes.$.find('/personal/users/1/fake')).toBe(null)
    expect(routes.$.find('/personal/fake')).toBe(null)

    // Trailing slash
    expect(routes.$.find('/personal/')).toBe(routes.$)
    expect(routes.$.find('/personal/users/1/')).toBe(routes.users.id.$)

    // Max level
    expect(routes.$.find('/personal/users/1/comments', { depth: 0 })).toBe(
      routes.$
    )
    expect(routes.$.find('/personal/users/1/comments', { depth: 1 })).toBe(
      routes.users.$
    )
    expect(routes.$.find('/personal/users/1/comments', { depth: 2 })).toBe(
      routes.users.id.$
    )
    expect(routes.$.find('/personal/users/1/comments', { depth: 3 })).toBe(
      routes.users.id.comments.$
    )
  })

  test('Trailing slash', () => {
    const mb = routeBuilder({
      basePath: '/local',
      trailingSlash: true,
    })

    const menu = mb.build(
      mb.tree({
        users: segment({
          children: {
            id: param({
              children: {
                rating: segment(),
              },
            }),
          },
        }),
      })
    )

    expect(menu.$.route()).toBe('/local/')
    expect(menu.users.$.route()).toBe('/local/users/')
    expect(menu.users.id.rating.$.route({ id: 5 })).toBe(
      '/local/users/5/rating/'
    )
  })

  test('Exported types', () => {
    const tree = builder.tree({
      article: segment({
        children: {
          id: param(),
        },
      }),
    })

    const routes = builder.build(tree)
    const route: Route = routes.article.$
    const subroutes: Routes = routes.article

    expect(route.path).toBe('article')
    expect(subroutes.$.path).toBe('article')
  })

  test('Typed params', () => {
    const tree = builder.tree({
      user: segment({
        children: {
          name: param({
            children: {
              sister: segment({
                children: {
                  sisterName: param().setType<'Sofia'>(),
                },
              }),
            },
          }).setType<'Adeline' | 'John'>(),
        },
      }),
    })

    const routes = builder.build(tree)
    expect(
      routes.user.name.sister.sisterName.$.route({
        name: 'Adeline',
        sisterName: 'Sofia',
      })
    ).toBe('/personal/user/Adeline/sister/Sofia')
  })
})
