import { AllRouteDefinitions } from './models/all-route-definitions'
import {
  BaseRouteDefinition,
  RoutePartsGenerics,
  RouteType,
} from './models/route-definitions'
import { Overwrite } from './models/utils'

export interface SegmentGenerics extends RoutePartsGenerics {}

export interface SergmentDefinition<out TSegment extends SegmentGenerics>
  extends BaseRouteDefinition<TSegment> {
  kind: RouteType.Segment

  /**
   * Path relative to parent. By default paths equals to key.
   *
   * `pascalCase` keys will be transformed to `dash-case` routes.
   */
  path?: string
}

/**
 * Creates route segment.
 * All names automatically converted to `dash-case`.
 */
export function segment<
  TChildren extends Record<string, AllRouteDefinitions>,
  TMeta,
  TSegment extends SegmentGenerics
>(options?: { path?: string; children?: TChildren; meta?: TMeta }) {
  return { ...options, kind: RouteType.Segment } as SergmentDefinition<
    Overwrite<TSegment, { Children: TChildren; Meta: TMeta }>
  >
}
