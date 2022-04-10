import { NoArgs } from './models/no-args'
import { AllRouteDefinitions, ParamDefinition, PathDefinition, PathType } from './models/route-definitions'
import { RouteTreeConfig } from './models/route-tree-config'
import { Route } from './route'

type ParamType = string | number

type ParamCounter<T> = { [P in keyof T]: ParamType }

type PathDefinitions<T, TMeta> = {
  [P in keyof T]: AllRouteDefinitions<T[P], TMeta>
}

interface RouteActions<TMeta, TArgs> {
  $: Route<TMeta, TArgs>
}

export type Routes<TChildren = any, TMeta = undefined, TArgs = NoArgs> = RoutesTree<TChildren, TArgs> &
  RouteActions<TMeta, TArgs>

type RoutesTreeChildIsArg<T, TArgs, TName> = T extends ParamDefinition<infer TChildren, infer TMeta>
  ? Routes<TChildren, TMeta, ParamCounter<TArgs extends NoArgs ? TName : TArgs & TName>>
  : never

type RoutesTreeChildIsRoute<T, TArgs, TName> = T extends PathDefinition<infer TChildren, infer TMeta>
  ? Routes<TChildren, TMeta, TArgs>
  : RoutesTreeChildIsArg<T, TArgs, TName>

type RoutesTree<T, TArgs> = {
  [P in keyof T]: RoutesTreeChildIsRoute<T[P], TArgs, Pick<T, P>>
}

interface CreateRoutesArgs {
  /**
   * Creates route part. All names automatically converted to `dash-case`.
   */
  path: <TMeta, T>(options?: Omit<PathDefinition<T, TMeta>, 'type'>) => PathDefinition<T, TMeta>

  /**
   * Creates parameter part with `:name` pattern.
   */
  param: <TMeta, T>(options?: Omit<ParamDefinition<T, TMeta>, 'type'>) => ParamDefinition<T, TMeta>
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
