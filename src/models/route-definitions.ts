export enum PathType {
  Path,
  Param,
}

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

export interface PathDefinition<TChildren, TMeta = undefined> extends BaseRouteDefinition<TChildren, TMeta> {
  /**
   * Path relative to parent. By default paths equals to key.
   *
   * `pascalCase` keys will be transformed to `dash-case` routes.
   */
  path?: string
  type: PathType.Path
}

export interface ParamDefinition<TChildren, TMeta = undefined> extends BaseRouteDefinition<TChildren, TMeta> {
  type: PathType.Param
}

export type AllRouteDefinitions<T, TMeta> = PathDefinition<T, TMeta> | ParamDefinition<T, TMeta>
