import { AllRouteDefinitions, ArgKind, ArgType, RouteKind, ZeroArgs } from './types'

interface Arguments { [key: string]: ArgType }

type FullpathType<TArgs> = TArgs extends ZeroArgs
  ? () => string
  : (args: TArgs) => string

export interface Route<TMeta = undefined, TChildMeta = undefined, TArgs = any> {
  /**
   * Gets full path
   */
  readonly fullpath: FullpathType<TArgs>

  /**
   * Custom route data defined in RouteDefinition
   */
  readonly meta: TMeta

  /**
   * Gets children routes
   */
  readonly children: ReadonlyArray<Route<TChildMeta>>
}

export class RouteItem implements Route {
  private static readonly argPlaceHolder = (name: string) => `:${name}`

  meta: any
  children: Route[] = []

  private readonly _path: string
  private readonly _fullpath: string
  private readonly _kind: RouteKind['kind'] | ArgKind['kind']

  constructor(
    private readonly _parent: RouteItem | undefined,
    child: AllRouteDefinitions<any, any>,
    chainKey: string
  ) {
    if (_parent) {
      _parent.children.push(this)
    }

    this._kind = child.kind
    this.meta = child.meta

    //
    // ─── GENERATE RELATIVE PATH ──────────────────────────────────────
    //

    switch (child.kind) {
      case 'route':
        this._path = child.path || chainKey
        break

      case 'arg':
        this._path = RouteItem.argPlaceHolder(chainKey)
        break

      default:
        throw new Error()
    }

    //
    // ─── GENERATE FULLPATH ───────────────────────────────────────────
    //

    if (this._parent) {
      const parentPath = this._parent._fullpath
      const divider = parentPath.length > 0 && parentPath[parentPath.length - 1] === '/'
        ? ''
        : '/'

      this._fullpath = parentPath + divider + this._path
    }
    else {
      this._fullpath = this._path
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

    this.iterateToRoot(item => item._kind === 'arg' && requiredArgs.push(item._path))

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
