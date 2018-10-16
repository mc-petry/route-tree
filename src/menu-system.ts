import { Route, RouteItem } from './route-item'
import { AllRouteDefinitions, ArgDefinition, ArgKind, ArgType, MenuConfig, RouteDefinition, RouteKind, ZeroArgs } from './types'

/**
 * Allows to detect arguments count.
 */
type ArgsCounter<T> = { [P in keyof T]: ArgType }

type RouteDefinitions<T, TMeta> = {
  [P in keyof T]: AllRouteDefinitions<T[P], TMeta>
}

interface RouteChild<TMeta, TChildMeta, TArgs> {
  _: Route<TMeta, TChildMeta, TArgs>
}

type Routes<TChildren = any, TMeta = any, TArgs = ZeroArgs> =
  RoutesTree<TChildren, TArgs> &
  RouteChild<
  TMeta,
  TChildren extends RouteDefinitions<any, infer TChildMeta> ? TChildMeta : undefined,
  TArgs
  >

type RoutesTreeChildIsArg<T, TArgs, TName> = T extends ArgDefinition<infer TChildren, infer TMeta> & ArgKind
  ? Routes<TChildren, TMeta, ArgsCounter<TArgs extends ZeroArgs ? TName : TArgs & TName>>
  : never

type RoutesTreeChildIsRoute<T, TArgs, TName> = T extends RouteDefinition<infer TChildren, infer TMeta> & RouteKind
  ? Routes<TChildren, TMeta, TArgs>
  : RoutesTreeChildIsArg<T, TArgs, TName>

type RoutesTree<T, TArgs> = {
  [P in keyof T]: RoutesTreeChildIsRoute<T[P], TArgs, Pick<T, P>>
}

interface CreateRoutesArgs {
  /**
   * Creates the route part.
   */
  route: <TMeta, T>(options?: RouteDefinition<T, TMeta>) => RouteDefinition<T, TMeta> & RouteKind

  /**
   * Creates the argument part.
   */
  arg: <TMeta, T>(options?: ArgDefinition<T, TMeta>) => ArgDefinition<T, TMeta> & ArgKind
}

export interface MenuSystem<T> {
  /**
   * Gets the routes tree.
   */
  readonly routes: Routes<T, undefined>

  /**
   * Returns the route that match specified location.
   * Otherwise returns null.
   *
   * @param location Search path
   * @param maxDepth Maximum search depth. Depth 0 equals to root item
   */
  findRoute(location: string, maxDepth?: number): Route | null
}

class MenuSystemImpl<T> implements MenuSystem<T> {
  readonly routes: Routes<T>

  constructor(
    tree: RouteDefinitions<T, any>,
    private readonly _config: MenuConfig = {}
  ) {
    const root: RouteDefinition<any> & RouteKind = {
      kind: 'route',
      path: _config && _config.basePath || '/'
    }

    this.routes = {
      _: new RouteItem(_config, undefined, root, '') as Route
    } as Routes<T>

    this.build(this.routes as Routes, tree)
  }

  findRoute(location: string, maxLevel?: number): Route | null {
    const root = this.routes._

    if (!location.startsWith(root.path)) {
      return null
    }

    // Check is root
    if (
      location.length === root.path.length ||
      // With trailing slash
      (
        location.length - 1 === root.path.length &&
        location.slice(-1) === '/'
      ) ||
      maxLevel === 0
    ) {
      return root as Route
    }

    location = location.substr(root.path.length + 1)

    if (location.slice(-1) === '/') {
      location = location.slice(0, -1)
    }

    const parts = location.split('/')

    let item: Route = root as Route

    for (let i = 0; i < parts.length; i++) {
      for (let j = 0; j < item.children.length; j++) {
        const child = item.children[j]

        if (child.kind === 'route' && child.path === parts[i]) {
          item = child
          break
        }

        if (child.kind === 'arg') {
          item = child
          break
        }

        if (j === item.children.length - 1) {
          return null
        }
      }

      if (maxLevel && maxLevel === i + 1) {
        return item
      }
    }

    return item
  }

  private build(parent: Routes, tree: RouteDefinitions<any, any>) {
    if (!tree) {
      return
    }

    for (const key of Object.keys(tree)) {
      const value = tree[key]

      parent[key] = {
        _: new RouteItem(this._config, parent._ as RouteItem, value, key)
      }

      this.build(parent[key] as Routes, value.children)
    }
  }
}

/**
 * Creates a new menu builder.
 */
export const createMenuBuilder = (config?: MenuConfig) => {
  return {
    /**
     * Creates a new tree or sub tree.
     */
    tree: <T extends RouteDefinitions<any, any>>(fn: (data: CreateRoutesArgs) => T): T =>
      fn({
        arg: options => ({
          ...options,
          kind: 'arg'
        }),

        route: options => ({
          ...options,
          kind: 'route'
        })
      }),

    /**
     * Builds a menu from the tree.
     */
    build: <T extends RouteDefinitions<any, any>>(tree: T): MenuSystem<T> => {
      return new MenuSystemImpl<T>(tree, config)
    }
  }
}
