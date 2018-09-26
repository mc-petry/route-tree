import { Route, RouteItem } from './route-item'
import { AllRouteDefinitions, ArgDefinition, ArgKind, ArgType, MenuConfig, RouteDefinition, RouteKind, ZeroArgs } from './types'

/**
 * Allows to detect arguments count
 */
type ArgsCounter<T> = { [P in keyof T]: ArgType }

type RouteDefinitions<T, TMeta> = {
  [P in keyof T]: AllRouteDefinitions<T[P], TMeta>
}

interface RouteChild<TMeta, TArgs> {
  _: Route<TMeta, TArgs>
}

type Routes<TChildren = any, TMeta = any, TArgs = ZeroArgs> =
  RoutesTree<TChildren, TArgs> & RouteChild<TMeta, TArgs>

type RoutesTreeChildIsArg<T, TArgs, TName> = T extends ArgDefinition<infer TChildren, infer TMeta> & ArgKind
  ? Routes<TChildren, TMeta, ArgsCounter<TArgs extends ZeroArgs ? TName : TArgs & TName>>
  : never

type RoutesTreeChildIsRoute<T, TArgs, TName> = T extends RouteDefinition<infer TChildren, infer TMeta> & RouteKind
  ? Routes<TChildren, TMeta, TArgs>
  : RoutesTreeChildIsArg<T, TArgs, TName>

type RoutesTree<T, TArgs> = {
  [P in keyof T]: RoutesTreeChildIsRoute<T[P], TArgs, Pick<T, P>>
}

interface CreateRoutesArgs<TMeta> {
  /**
   * Creates route part
   */
  route: <T>(options?: RouteDefinition<T, TMeta>) => RouteDefinition<T, TMeta> & RouteKind

  /**
   * Creates argument part
   */
  arg: <T>(options?: ArgDefinition<T, TMeta>) => ArgDefinition<T, TMeta> & ArgKind
}

export interface MenuSystem<T, TMeta> {
  routes: Routes<T, TMeta>
}

class MenuSystemImpl<T, TMeta> implements MenuSystem<T, TMeta> {
  private static build(parent: Routes, tree: RouteDefinitions<any, any>) {
    if (!tree) {
      return
    }

    for (const key of Object.keys(tree)) {
      const value = tree[key]

      parent[key] = {
        _: new RouteItem(parent._ as RouteItem, value, key)
      }

      this.build(parent[key] as Routes, value.children)
    }
  }

  readonly routes: Routes<T, TMeta>

  constructor(tree: RouteDefinitions<T, TMeta>, config: MenuConfig | undefined) {
    const root: RouteDefinition<{}, {}> & RouteKind = {
      kind: 'route',
      path: config && config.basePath || '/'
    }

    this.routes = {
      _: new RouteItem(undefined, root, '') as Route<any, any>
    } as Routes<T, TMeta>

    MenuSystemImpl.build(this.routes as Routes, tree)
  }
}

/**
 * Creates new menu builder
 */
export const createMenuBuilder = <TMeta = never>(config?: MenuConfig) => {
  return {
    /**
     * Creates new tree or sub tree
     */
    tree: <T extends RouteDefinitions<any, TMeta>>(fn: (data: CreateRoutesArgs<TMeta>) => T): T => {
      const q = fn({
        arg: options => ({
          ...options,
          kind: 'arg'
        }),

        route: options => ({
          ...options,
          kind: 'route'
        })
      })
      return q
    },

    /**
     * Builds menu
     */
    build: <T extends RouteDefinitions<any, TMeta>>(tree: T): MenuSystem<T, TMeta> => {
      return new MenuSystemImpl<T, TMeta>(tree, config)
    }
  }
}
