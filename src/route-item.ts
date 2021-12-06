import { AllRouteDefinitions, NoArgs, PathType, RouteTreeConfig } from './types'

type FullpathType<TArgs> = TArgs extends NoArgs ? () => string : (args: TArgs) => string

/**
 * @internal
 */
export class Route<TMeta = undefined, TChildMeta = undefined, TArgs = any> {
  private static readonly paramPlaceHolder = (name: string) => `:${name}`

  /**
   * Gets the custom route attributes defined in RouteDefinition.
   */
  readonly meta: TMeta

  /**
   * Gets the children routes.
   */
  readonly children: Route<TChildMeta, any, TArgs>[] = []

  /**
   * Gets the relative path.
   */
  readonly path: string

  /**
   * Gets the route type.
   */
  readonly type: PathType

  private readonly _route: string

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

    // Generate route
    if (this._parent) {
      const parentPath = this._parent._route
      const divider = parentPath.slice(-1) === '/' ? '' : '/'

      this._route = parentPath + divider + this.path
    } else {
      this._route = this.path
    }

    if (this._config.trailingSlash) {
      this._route += '/'
    }
  }

  /**
   * Builds the full route.
   */
  readonly route = ((args?: any) => {
    let fp = this._route

    if (args) {
      for (const key of Object.keys(args)) {
        fp = fp.replace(Route.paramPlaceHolder(key), args[key].toString())
      }
    }

    return fp
  }) as FullpathType<TArgs>

  /**
   * Returns a child route that matches specified location.
   *
   * @param location Search path
   * @param maxDepth Maximum search depth. Depth 0 equals to root item
   */
  find(location: string, maxLevel?: number): Route | null {
    const root = this as Route<any>

    if (!location.startsWith(root.path)) {
      return null
    }

    // Check is root
    if (location === root.path || location === root.path + '/' || maxLevel === 0) {
      return root
    }

    location = location.substr(root.path.length === 1 ? 1 : root.path.length + 1)

    if (location.slice(-1) === '/') {
      location = location.slice(0, -1)
    }

    const parts = location.split('/')

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

      if (maxLevel && maxLevel === i + 1) {
        return item
      }
    }

    return item
  }
}
