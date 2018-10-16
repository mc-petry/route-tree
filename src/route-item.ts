import { AllRouteDefinitions, ArgType, MenuConfig, RouteType, ZeroArgs } from './types'

interface Arguments {
  [key: string]: ArgType
}

type FullpathType<TArgs> = TArgs extends ZeroArgs
  ? () => string
  : (args: TArgs) => string

export interface Route<TMeta = undefined, TChildMeta = undefined, TArgs = any> {
  /**
   * Builds the full path.
   */
  readonly fullpath: FullpathType<TArgs>

  /**
   * Gets the relative path.
   */
  readonly path: string

  /**
   * Gets the custom route attributes defined in RouteDefinition.
   */
  readonly meta: TMeta

  /**
   * Gets the children routes.
   */
  readonly children: ReadonlyArray<Route<TChildMeta>>

  /**
   * Gets the route type.
   */
  readonly kind: RouteType
}

export class RouteItem implements Route {
  private static readonly argPlaceHolder = (name: string) => `:${name}`

  readonly meta: any
  readonly children: Route[] = []
  readonly path: string
  readonly kind: RouteType

  private readonly _fullpath: string

  constructor(
    private readonly _config: MenuConfig,
    private readonly _parent: RouteItem | undefined,
    child: AllRouteDefinitions<any, any>,
    chainKey: string
  ) {
    if (_parent) {
      _parent.children.push(this)
    }

    this.kind = child.kind
    this.meta = child.meta

    //
    // ─── GENERATE RELATIVE PATH ──────────────────────────────────────
    //

    switch (child.kind) {
      case 'route':
        this.path = child.path || chainKey.replace(/[A-Z]/g, m => '-' + m.toLowerCase())
        break

      case 'arg':
        this.path = RouteItem.argPlaceHolder(chainKey)
        break

      default:
        throw new Error()
    }

    //
    // ─── GENERATE FULLPATH ───────────────────────────────────────────
    //

    if (this._parent) {
      const parentPath = this._parent._fullpath
      const divider = parentPath.slice(-1) === '/' ? '' : '/'

      this._fullpath = parentPath + divider + this.path
    }
    else {
      this._fullpath = this.path
    }

    if (this._config.trailingSlash) {
      this._fullpath += '/'
    }
  }

  fullpath(args?: Arguments): string {
    let fp = this._fullpath

    if (process.env.NODE_ENV !== 'production') {
      this.checkArguments(args)
    }

    if (args) {
      for (const key of Object.keys(args)) {
        fp = fp.replace(RouteItem.argPlaceHolder(key), args[key].toString())
      }
    }

    return fp
  }

  private iterateToRoot(fn: (item: RouteItem) => void) {
    let current: RouteItem | undefined = this

    while (current) {
      fn(current)
      current = current._parent
    }
  }

  private checkArguments(args?: Arguments) {
    const receivedArgs = args ? Object.keys(args) : []
    const requiredArgs: string[] = []

    this.iterateToRoot(item => item.kind === 'arg' && requiredArgs.push(item.path))

    if (
      requiredArgs.length !== receivedArgs.length ||
      receivedArgs.some(x => !requiredArgs.includes(RouteItem.argPlaceHolder(x)))
    ) {
      throw new TypeError(
        `Received arguments: [${receivedArgs.join(', ')}]. ` +
        `Required arguments: [${requiredArgs.map(x => x.substr(1)).join(', ')}]`
      )
    }
  }
}
