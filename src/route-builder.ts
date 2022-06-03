import { AllRouteDefinitions } from './models/all-route-definitions'
import { NoArgs } from './models/no-args'
import { RouteBuilderConfig } from './models/route-builder-config'
import {
  BaseRouteDefinition,
  RoutePartsGenerics,
  RouteType
} from './models/route-definitions'
import { ParamDefinition } from './param'
import { Route } from './route'
import { SegmentGenerics, SergmentDefinition } from './segment'

type ParamCounter<out T> = {
  [P in keyof T]: T[P] extends ParamDefinition<infer TParams>
    ? TParams['Type']
    : T[P]
}

type PathDefinitions<out T extends { [key: string]: RoutePartsGenerics }> = {
  [P in keyof T]: BaseRouteDefinition<T[P]> & AllRouteDefinitions
}

interface RouteActions<out TMeta, out TArgs> {
  $: Route<TMeta, TArgs>
}

export type Routes<TChildren = any, TMeta = any, TArgs = NoArgs> = RoutesTree<
  TChildren,
  TArgs
> &
  RouteActions<TMeta, TArgs>

type RoutesTreeChildIsParam<T, TArgs, TName> = T extends ParamDefinition<
  infer TParams
>
  ? Routes<
      TParams['Children'],
      TParams['Meta'],
      ParamCounter<TArgs extends NoArgs ? TName : TArgs & TName>
    >
  : never

type RoutesTreeChildIsSegment<T, TParams, TParamsCollected> =
  T extends SergmentDefinition<infer TSegment>
    ? Routes<TSegment['Children'], TSegment['Meta'], TParams>
    : RoutesTreeChildIsParam<T, TParams, TParamsCollected>

type RoutesTree<out T, out TArgs> = {
  [P in keyof T]: RoutesTreeChildIsSegment<T[P], TArgs, Pick<T, P>>
}

/**
 * Creates route tree builder.
 */
export const routeBuilder = (config: RouteBuilderConfig = {}) => {
  return {
    /**
     * Creates a new tree or subtree.
     */
    tree: <T extends PathDefinitions<any>>(data: T): T => data,

    /**
     * Builds a routes from tree.
     */
    build: <T extends PathDefinitions<any>>(tree: T) => {
      function buildChildren(
        parent: Routes,
        tree: PathDefinitions<any> | undefined
      ) {
        if (!tree) {
          return
        }

        for (const key of Object.keys(tree)) {
          const value = tree[key]

          parent[key] = {
            $: new Route(config, parent.$, value, key) as Route<any, any>,
          } as Routes

          buildChildren(parent[key] as Routes<any>, value.children)
        }
      }

      const root = {
        kind: RouteType.Segment,
        path: config.basePath || '/',
      } as SergmentDefinition<SegmentGenerics>

      const routes = {
        $: new Route(config, undefined, root, '') as Route,
      } as Routes<T>

      buildChildren(routes, tree)

      return routes
    },
  }
}
