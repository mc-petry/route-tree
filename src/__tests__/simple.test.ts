import { createMenuBuilder } from '..'

describe('Simple', () => {
  const builder = createMenuBuilder()

  const tree = builder.tree(({ route, arg }) => ({
    categories: route({
      children: {
        category: arg({
          children: {
            movies: route({
              children: {
                movie: arg({
                  children: {
                    details: route()
                  }
                })
              }
            })
          }
        })
      }
    })
  }))

  const menu = builder.build(tree)

  it('Arguments', () => {
    expect(
      menu.routes
        .categories.category
        .movies.movie
        .details
        ._.fullpath({ category: 'comedy', movie: '1' })
    ).toBe(`/categories/comedy/movies/1/details`)

    expect(menu.routes._.fullpath()).toBe(`/`)

    expect(
      menu.routes
        .categories.category
        ._.fullpath({ category: 'horror' })
    ).toBe(`/categories/horror`)
  })
})
