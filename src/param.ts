import { AllRouteDefinitions } from './models/all-route-definitions'
import {
  BaseRouteDefinition,
  RoutePartsGenerics,
  RouteType,
} from './models/route-definitions'
import { Overwrite } from './models/utils'

export type ParamBaseType = string | number

export interface ParamGenerics extends RoutePartsGenerics {
  Type: ParamBaseType
}

export interface ParamDefinition<out TParams extends ParamGenerics>
  extends BaseRouteDefinition<TParams> {
  /**
   * @internal
   */
  kind: RouteType.Param

  /**
   * Sets custom parameter type.
   *
   * @example
   * ```tsx
   * .setType<'id' | 'name'>()
   * ```
   */
  setType: <TType extends ParamBaseType>() => ParamDefinition<
    Overwrite<TParams, { Type: TType }>
  >
}

/**
 * Creates route parameter with `:name` pattern.
 */
export function param<
  TChildren extends Record<string, AllRouteDefinitions>,
  TMeta,
  TParam extends ParamGenerics
>(options?: { children?: TChildren; meta?: TMeta }) {
  return {
    ...options,
    kind: RouteType.Param,

    setType() {
      return this as ParamDefinition<any>
    },
  } as ParamDefinition<Overwrite<TParam, { Children: TChildren; Meta: TMeta }>>
}
