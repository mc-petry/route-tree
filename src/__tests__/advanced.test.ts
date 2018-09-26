import { createMenuBuilder } from '..'

describe('Advanced', () => {
  const builder = createMenuBuilder<{ hidden?: boolean }>({
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

  it('Meta', () => {
    const menu = builder.build(
      builder.tree(({ route }) => ({
        home: route(),
        about: route({
          meta: {
            hidden: true
          }
        })
      }))
    )

    expect(
      menu.routes.about._.meta &&
      menu.routes.about._.meta.hidden
    ).toBe(true)
  })
})
