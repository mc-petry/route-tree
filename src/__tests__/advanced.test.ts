import { createMenuBuilder } from '..'

describe('Advanced', () => {
  const builder = createMenuBuilder({
    basePath: '/personal'
  })

  it('Split sub trees', () => {
    const articlesTree = builder.tree(({ route, arg }) => ({
      article: route({
        children: {
          id: arg()
        }
      })
    }))

    const usersTree = builder.tree(({ route, arg }) => ({
      users: route({
        children: {
          id: arg({
            children: {
              topics: route(),
              comments: route()
            }
          })
        }
      })
    }))

    const menu = builder.build({
      ...articlesTree,
      ...usersTree
    })

    expect(menu.routes.article.id._.fullpath({ id: '25' }))
      .toBe(`/personal/article/25`)

    expect(menu.routes.users.id.comments._.fullpath({ id: '1' }))
      .toBe(`/personal/users/1/comments`)
  })

  it('Children', () => {
    const menu = builder.build(
      builder.tree(({ route, arg }) => ({
        articles: route({
          children: {
            id: arg({
              children: {
                comments: route(),
                claps: route()
              }
            })
          }
        }),
        users: route()
      }))
    )

    expect(menu.routes._.children.length).toBe(2)

    expect(menu.routes.articles.id._.children[0])
      .toBe(menu.routes.articles.id.comments._)

    expect(menu.routes.articles.id._.children[0].fullpath({ id: 'how-use-menu-system' }))
      .toBe('/personal/articles/how-use-menu-system/comments')

    expect(menu.routes.articles.id._.children[1].fullpath({ id: 'how-use-menu-system' }))
      .toBe('/personal/articles/how-use-menu-system/claps')
  })

  it('Meta', () => {
    const menu = builder.build(
      builder.tree(({ route }) => ({
        home: route({
          meta: { theme: 'light' },
          children: {
            projects: route({
              meta: { visible: false },
              children: {
                shared: route({
                  meta: {
                    prop: '1'
                  }
                }),
                personal: route({
                  meta: {
                    prop: '2'
                  }
                })
              }
            })
          }
        }),
        about: route({
          meta: { theme: 'dark' }
        })
      }))
    )

    // Direct meta
    expect(menu.routes.home._.meta.theme).toBe('light')
    expect(menu.routes.about._.meta.theme).toBe('dark')
    expect(menu.routes.home.projects._.meta.visible).toBeFalsy()

    // Children meta
    expect(menu.routes._.children[0].meta.theme).toBe('light')
    expect(menu.routes._.children[1].meta.theme).toBe('dark')
    expect(menu.routes.home.projects._.children[0].meta.prop).toBe('1')
    expect(menu.routes.home.projects._.children[1].meta.prop).toBe('2')
  })

  it('Find child', () => {
    const menu = builder.build(
      builder.tree(({ route, arg }) => ({
        users: route({
          children: {
            id: arg({
              children: {
                view: route(),
                comments: route()
              }
            })
          }
        })
      }))
    )

    expect(menu.findRoute('/personal'))
      .toBe(menu.routes._)

    expect(menu.findRoute('/personal/users'))
      .toBe(menu.routes.users._)

    expect(menu.findRoute('/personal/users/1'))
      .toBe(menu.routes.users.id._)

    expect(menu.findRoute('/personal/users/1/comments'))
      .toBe(menu.routes.users.id.comments._)

    // ─────────────────────────────────────────────────────────────────
    // Fake

    expect(menu.findRoute('/personal/users/1/fake'))
      .toBe(null)

    expect(menu.findRoute('/personal/fake'))
      .toBe(null)

    // ─────────────────────────────────────────────────────────────────
    // Trailing slash

    expect(menu.findRoute('/personal/'))
      .toBe(menu.routes._)

    expect(menu.findRoute('/personal/users/1'))
      .toBe(menu.routes.users.id._)

    // ─────────────────────────────────────────────────────────────────
    // Max level

    expect(menu.findRoute('/personal/users/1/comments', 0))
      .toBe(menu.routes._)

    expect(menu.findRoute('/personal/users/1/comments', 1))
      .toBe(menu.routes.users._)

    expect(menu.findRoute('/personal/users/1/comments', 2))
      .toBe(menu.routes.users.id._)

    expect(menu.findRoute('/personal/users/1/comments', 3))
      .toBe(menu.routes.users.id.comments._)
  })
})
