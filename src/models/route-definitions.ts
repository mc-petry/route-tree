export enum RouteType {
  Segment,
  Param,
}

export interface BaseRouteDefinition<
  out T extends Record<string, unknown> | {}
> {
  /**
   * Children routes.
   */
  children?: T

  /**
   * @internal
   */
  meta?: any
}

export interface RoutePartsGenerics {
  Children: any
  Meta: any
}
