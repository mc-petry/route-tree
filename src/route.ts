import { NoArgs } from './models/no-args'
import { AllRouteDefinitions, PathType } from './models/route-definitions'
import { RouteTreeConfig } from './models/route-tree-config'

export class Route<TMeta = undefined, TArgs = any> {
  private static readonly paramPlaceHolder = (name: string) => `:${name}`

  /**
   * Gets the custom route attributes defined in RouteDefinition.
   */
  readonly meta: TMeta

  /**
   * Gets the children routes.
   */
  readonly children: Route<TMeta, TArgs>[] = []

  /**
   * Gets the relative path.
   */
  readonly path: string

  /**
   * Gets the route type.
   */
  readonly type: PathType

  /**
   * Gets the route pattern.
   */
  readonly pattern: string

  constructor(
    private readonly _config: RouteTreeConfig,
    private readonly _parent: Route | undefined,
    child: AllRouteDefinitions<any, any>,
    chainKey: string
  ) {
    if (_parent) {
      _parent.children.push(this as Route<any>)
    }

    this.type = child.type
    this.meta = child.meta

    // Generate relative path
    switch (child.type) {
      case PathType.Path:
        this.path = child.path || chainKey.replace(/[A-Z]/g, x => '-' + x.toLowerCase())
        break

      case PathType.Param:
        this.path = Route.paramPlaceHolder(chainKey)
        break

      default:
        throw new Error()
    }

    // Generate pattern
    if (this._parent) {
      const parentPath = this._parent.pattern
      const divider = parentPath.slice(-1) === '/' ? '' : '/'

      this.pattern = parentPath + divider + this.path
    } else {
      this.pattern = this.path
    }

    if (this._config.trailingSlash) {
      this.pattern += '/'
    }
  }

  /**
   * Builds a full route.
   */
  readonly route = ((args?: any) => {
    let fp = this.pattern

    if (args) {
      for (const key of Object.keys(args)) {
        fp = fp.replace(Route.paramPlaceHolder(key), args[key].toString())
      }
    }

    return fp
  }) as TArgs extends NoArgs ? () => string : (args: TArgs) => string

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
    const root = this as Route<any>

    if (!pathname.startsWith(root.path)) {
      return null
    }

    if (pathname === root.path || pathname === root.path + '/' || options.depth === 0) {
      return root
    }

    pathname = pathname.substring(root.path.length === 1 ? 1 : root.path.length + 1)

    if (pathname.slice(-1) === '/') {
      pathname = pathname.slice(0, -1)
    }

    const parts = pathname.split('/')

    let item: Route = root as Route

    for (let i = 0; i < parts.length; i++) {
      for (let j = 0; j < item.children.length; j++) {
        const child = item.children[j]

        if (child.type === PathType.Path && child.path === parts[i]) {
          item = child
          break
        }

        if (child.type === PathType.Param) {
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
