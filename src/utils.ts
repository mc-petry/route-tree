import { Routes } from './route-builder'

type AsStringsOnly<T> = { [P in keyof T]: string }

/**
 * Useful for getting type of route params.
 */
export type RouteParams<T extends Routes<any, any, any>> = T extends Routes<
  any,
  any,
  infer TArgs
>
  ? AsStringsOnly<TArgs>
  : undefined
