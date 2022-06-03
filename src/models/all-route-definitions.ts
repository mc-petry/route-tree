import { ParamDefinition, ParamGenerics } from '../param'
import { SegmentGenerics, SergmentDefinition } from '../segment'

export type AllRouteDefinitions =
  | ParamDefinition<ParamGenerics>
  | SergmentDefinition<SegmentGenerics>
