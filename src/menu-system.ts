import { Route } from './route-item'
import {
  AllRouteDefinitions,
  ArgumentDefinition,
  NoArgs,
  ParamType,
  PathDefinition,
  PathType,
  RouteTreeConfig,
} from './types'

/**
 * Allows to detect arguments count.
 */
type ArgsCounter<T> = { [P in keyof T]: ParamType }

type PathDefinitions<T, TMeta> = {
  [P in keyof T]: AllRouteDefinitions<T[P], TMeta>
}

interface RouteChild<TMeta, TChildMeta, TArgs> {
  $: Route<TMeta, TChildMeta, TArgs>
}

type Routes<TChildren = any, TMeta = undefined, TArgs = NoArgs> = RoutesTree<TChildren, TArgs> &
  RouteChild<TMeta, TChildren extends PathDefinitions<any, infer TChildMeta> ? TChildMeta : undefined, TArgs>

type RoutesTreeChildIsArg<T, TArgs, TName> = T extends ArgumentDefinition<infer TChildren, infer TMeta>
  ? Routes<TChildren, TMeta, ArgsCounter<TArgs extends NoArgs ? TName : TArgs & TName>>
  : never

type RoutesTreeChildIsRoute<T, TArgs, TName> = T extends PathDefinition<infer TChildren, infer TMeta>
  ? Routes<TChildren, TMeta, TArgs>
  : RoutesTreeChildIsArg<T, TArgs, TName>

type RoutesTree<T, TArgs> = {
  [P in keyof T]: RoutesTreeChildIsRoute<T[P], TArgs, Pick<T, P>>
}

interface CreateRoutesArgs {
  /**
   * Creates the route part.
   */
  path: <TMeta, T>(options?: Omit<PathDefinition<T, TMeta>, 'type'>) => PathDefinition<T, TMeta>

  /**
   * Creates the argument part.
   */
  param: <TMeta, T>(options?: Omit<ArgumentDefinition<T, TMeta>, 'type'>) => ArgumentDefinition<T, TMeta>
}

class RouteTree<T> {
  /**
   * Gets the routes tree.
   */
  readonly routes: Routes<T, undefined>

  constructor(tree: PathDefinitions<T, any>, private readonly _config: RouteTreeConfig = {}) {
    const root: PathDefinition<any> = {
      type: PathType.Path,
      path: (_config && _config.basePath) || '/',
    }

    this.routes = {
      $: new Route(_config, undefined, root, '') as Route,
    } as Routes<T>

    this.build(this.routes as Routes, tree)
  }

  /**
   * Returns the route that match specified location.
   * Otherwise returns null.
   *
   * @param location Search path
   * @param maxDepth Maximum search depth. Depth 0 equals to root item
   */
  find(location: string, maxLevel?: number): Route | null {
    const root = this.routes.$

    if (!location.startsWith(root.path)) {
      return null
    }

    // Check is root
    if (
      location.length === root.path.length ||
      // With trailing slash
      (location.length - 1 === root.path.length && location.slice(-1) === '/') ||
      maxLevel === 0
    ) {
      return root as Route
    }

    location = location.substr(root.path.length === 1 ? 1 : root.path.length + 1)

    if (location.slice(-1) === '/') {
      location = location.slice(0, -1)
    }

    const parts = location.split('/')

    let item: Route = root as Route

    for (let i = 0; i < parts.length; i++) {
      for (let j = 0; j < item.children.length; j++) {
        const child = item.children[j]

        if (child.type === PathType.Path && child.path === parts[i]) {
          item = child
          break
        }

        if (child.type === PathType.Param) {
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

  private build(parent: Routes, tree: PathDefinitions<any, any>) {
    if (!tree) {
      return
    }

    for (const key of Object.keys(tree)) {
      const value = tree[key]

      parent[key] = {
        $: new Route(this._config, parent.$, value, key) as Route,
      }

      this.build(parent[key] as Routes<any>, value.children)
    }
  }
}

/**
 * Creates route tree builder.
 */
export const routeBuilder = (config: RouteTreeConfig = {}) => {
  return {
    /**
     * Creates a new tree or subtree.
     */
    tree: <T extends PathDefinitions<any, any>>(fn: (data: CreateRoutesArgs) => T): T =>
      fn({
        param: options => ({ ...options, type: PathType.Param }),
        path: options => ({ ...options, type: PathType.Path }),
      }),

    /**
     * Builds a routes from tree.
     */
    build: <T extends PathDefinitions<any, any>>(tree: T) => {
      function buildChildren(parent: Routes, tree: PathDefinitions<any, any> | undefined) {
        if (!tree) {
          return
        }

        for (const key of Object.keys(tree)) {
          const value = tree[key]

          parent[key] = {
            $: new Route(config, parent.$, value, key) as Route,
          }

          buildChildren(parent[key] as Routes<any>, value.children)
        }
      }

      const root: PathDefinition<any> = {
        type: PathType.Path,
        path: config.basePath || '/',
      }

      const routes = {
        $: new Route(config, undefined, root, '') as Route,
      } as Routes<T>

      buildChildren(routes, tree)

      return routes
    },
  }
}
