export interface RouteKind {
  kind: 'route'
}

export interface ArgKind {
  kind: 'arg'
}

export type RouteType = RouteKind['kind'] | ArgKind['kind']

interface BaseRouteDefinition<T, TMeta> {
  /**
   * Chidlren routes.
   */
  children?: T

  /**
   * Custom route attributes.
   * Useful to store specific params and use it when iterate over parents children.
   */
  meta?: TMeta
}

export interface RouteDefinition<TChildren, TMeta = undefined> extends BaseRouteDefinition<TChildren, TMeta> {
  /**
   * Path relative to parent. By default paths equals to key.
   * `pascalCase` keys will be transformed to `dash-case` routes.
   */
  path?: string
}

export interface ArgDefinition<TChildren, TMeta = undefined> extends BaseRouteDefinition<TChildren, TMeta> {
}

export type AllRouteDefinitions<T, TMeta> =
  (RouteDefinition<T, TMeta> & RouteKind) |
  (ArgDefinition<T, TMeta> & ArgKind)

export interface MenuConfig {
  /**
   * Global routes prefix.
   * @default '/'
   */
  basePath?: string

  /**
   * Use trailing slash on routes
   * @default false
   */
  trailingSlash?: boolean
}

export type ZeroArgs = 'noargs'

export type ArgType = string | number
