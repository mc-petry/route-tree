import { routeBuilder } from '..'

describe('Simple', () => {
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
  }))

  const menu = builder.build(tree)

  it('Arguments', () => {
    expect(menu.categories.category.movies.movie.details.$.route({ category: 'comedy', movie: '1' })).toBe(
      `/categories/comedy/movies/1/details`
    )

    expect(menu.$.route()).toBe(`/`)
    expect(menu.categories.category.$.route({ category: 'horror' })).toBe(`/categories/horror`)
  })

  it('pascalCase to dash-case path', () => {
    expect(menu.someRoute.$.route()).toBe(`/some-route`)
    expect(menu.someRoute.nestRoute.$.route()).toBe(`/some-route/nest-route`)
  })
})
