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
                comments: route()
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
})
