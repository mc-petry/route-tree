export interface RouteKind {
  kind: 'route'
}

export interface ArgKind {
  kind: 'arg'
}

interface BaseRouteDefinition<T, TMeta> {
  /**
   * Chidlren routes
   */
  children?: T

  /**
   * Custom route attributes
   */
  meta?: TMeta
}

export interface RouteDefinition<TChildren, TMeta = undefined> extends BaseRouteDefinition<TChildren, TMeta> {
  /**
   * Path relative to parent
   * By default paths equals to key
   */
  path?: string
}

export interface ArgDefinition<TChildren, TMeta = undefined> extends BaseRouteDefinition<TChildren, TMeta> {
}

export type AllRouteDefinitions<T, TMeta> =
  (RouteDefinition<T, TMeta> & RouteKind) |
  (ArgDefinition<T, TMeta> & ArgKind)

export interface MenuConfig {
  basePath?: string
}

export type ZeroArgs = 'noargs'

export type ArgType = string | number
