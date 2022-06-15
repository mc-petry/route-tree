import { AllRouteDefinitions } from './models/all-route-definitions'
import { RouteBuilderConfig } from './models/route-builder-config'
import { RouteType } from './models/route-definitions'
import { ParamBaseType } from './param'

export class Route<
  out TMeta = unknown,
  out TChildrenMeta = unknown,
  out TArgs = any
> {
  static readonly #paramPlaceHolder = (name: string) => `:${name}`

  #config: RouteBuilderConfig

  /**
   * Gets the custom route attributes defined in RouteDefinition.
   */
  readonly meta: TMeta

  /**
   * Gets the parent route.
   */
  readonly parent: Route | null = null

  /**
   * Gets the children routes.
   */
  readonly children: Route<TChildrenMeta, TArgs>[] = []

  /**
   * Gets the relative path.
   *
   * @example
   * ```
   * // profile: segment() -> user: param() -> settings: segment()
   *
   * routes.profile.user.$.path === ':user'
   * routes.profile.user.settings.$.path === 'settings'
   * ```
   */
  readonly path: string

  /**
   * Gets the route type.
   */
  readonly kind: RouteType

  /**
   * Gets the route pattern.
   *
   * @example
   * ```
   * // profile: path() -> user: param() -> settings: path()
   *
   * routes.profile.user.$.pattern === '/profile/:user'
   * routes.profile.user.settings.$.pattern === '/profile/:user/settings'
   * ```
   */
  readonly pattern: string

  constructor(
    config: RouteBuilderConfig,
    parent: Route | undefined,
    child: AllRouteDefinitions,
    chainKey: string
  ) {
    this.#config = config

    if (parent) {
      this.parent = parent
      this.parent.children.push(this)
    }

    this.kind = child.kind
    this.meta = child.meta

    // Generate relative path
    switch (child.kind) {
      case RouteType.Segment:
        this.path =
          child.path || chainKey.replace(/[A-Z]/g, x => '-' + x.toLowerCase())
        break

      case RouteType.Param:
        this.path = Route.#paramPlaceHolder(chainKey)
        break

      default:
        throw new Error()
    }

    // Generate pattern
    if (this.parent) {
      const parentPath = this.parent.pattern
      const divider = parentPath.slice(-1) === '/' ? '' : '/'

      this.pattern = parentPath + divider + this.path
    } else {
      this.pattern = this.path
    }

    if (this.#config.trailingSlash) {
      this.pattern += '/'
    }
  }

  /**
   * Builds a full route.
   *
   * @example
   * ```
   * // profile: segment() -> user: param() -> settings: segment()
   *
   * routes.profile.user.$.route({ user: 'John' }) === '/profile/John'
   * routes.profile.user.settings.$.route({ user 'John' }) === '/profile/John/settings'
   * ```
   */
  route(params: TArgs extends undefined ? void : TArgs) {
    let fp = this.pattern
    const typedParams = params as Record<string, ParamBaseType> | undefined

    if (typedParams) {
      for (const key of Object.keys(typedParams)) {
        fp = fp.replace(
          Route.#paramPlaceHolder(key),
          typedParams[key].toString()
        )
      }
    }

    return fp
  }

  /**
   * Returns a child route that matches specified pathname.
   */
  find(
    pathname: string,
    options: {
      /**
       * Maximum search depth. Depth 0 equals to root item.
       */
      depth?: number
    } = {}
  ): Route | null {
    const root = this

    if (!pathname.startsWith(root.path)) {
      return null
    }

    if (
      pathname === root.path ||
      pathname === root.path + '/' ||
      options.depth === 0
    ) {
      return root
    }

    pathname = pathname.substring(
      root.path.length === 1 ? 1 : root.path.length + 1
    )

    if (pathname.slice(-1) === '/') {
      pathname = pathname.slice(0, -1)
    }

    const parts = pathname.split('/')

    let item: Route = root as Route

    for (let i = 0; i < parts.length; i++) {
      for (let j = 0; j < item.children.length; j++) {
        const child = item.children[j]

        if (child.kind === RouteType.Segment && child.path === parts[i]) {
          item = child
          break
        }

        if (child.kind === RouteType.Param) {
          item = child
          break
        }

        if (j === item.children.length - 1) {
          return null
        }
      }

      if (options.depth === i + 1) {
        return item
      }
    }

    return item
  }
}
