export interface RouteBuilderConfig {
  /**
   * Global routes prefix.
   * @default '/'
   */
  basePath?: string

  /**
   * Use trailing slash on routes
   * @default false
   */
  trailingSlash?: boolean
}
