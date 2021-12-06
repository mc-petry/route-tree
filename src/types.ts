/**
 * @internal
 */
export enum PathType {
  Path,
  Param,
}

/**
 * @internal
 */
interface BaseRouteDefinition<T, TMeta> {
  /**
   * Children routes.
   */
  children?: T

  /**
   * Custom route attributes.
   *
   * Useful for storing specific parameters and using them when iterating over parent children.
   */
  meta?: TMeta
}

/**
 * @internal
 */
export interface PathDefinition<TChildren, TMeta = undefined> extends BaseRouteDefinition<TChildren, TMeta> {
  /**
   * Path relative to parent. By default paths equals to key.
   *
   * `pascalCase` keys will be transformed to `dash-case` routes.
   */
  path?: string

  /**
   * @internal
   */
  type: PathType.Path
}

/**
 * @internal
 */
export interface ArgumentDefinition<TChildren, TMeta = undefined> extends BaseRouteDefinition<TChildren, TMeta> {
  /**
   * @internal
   */
  type: PathType.Param
}

/**
 * @internal
 */
export type AllRouteDefinitions<T, TMeta> = PathDefinition<T, TMeta> | ArgumentDefinition<T, TMeta>

export interface RouteTreeConfig {
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

export type NoArgs = undefined //'noargs'

export type ParamType = string | number
