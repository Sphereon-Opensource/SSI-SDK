export type TClaimsColumns =
  | 'context'
  | 'credentialType'
  | 'type'
  | 'value'
  | 'isObj'
  | 'id'
  | 'issuer'
  | 'subject'
  | 'expirationDate'
  | 'issuanceDate'

/**
 * Represents the sort order of results from a {@link FindArgs} query.
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export interface Order<TColumns> {
  column: TColumns
  direction: 'ASC' | 'DESC'
}

/**
 * Represents a WHERE predicate for a {@link FindArgs} query.
 * In situations where multiple WHERE predicates are present, they are combined with AND.
 *
 * @beta This API may change without a BREAKING CHANGE notice.
 */
export interface Where<TColumns> {
  column: TColumns
  value?: string[]
  not?: boolean
  op?: 'LessThan' | 'LessThanOrEqual' | 'MoreThan' | 'MoreThanOrEqual' | 'Equal' | 'Like' | 'Between' | 'In' | 'Any' | 'IsNull'
}

export interface FindArgs<TColumns> {
  /**
   * Imposes constraints on the values of the given columns.
   * WHERE clauses are combined using AND.
   */
  where?: Where<TColumns>[]

  /**
   * Sorts the results according to the given array of column priorities.
   */
  order?: Order<TColumns>[]

  /**
   * Ignores the first number of entries in a {@link IDataStoreORM} query result.
   */
  skip?: number

  /**
   * Returns at most this number of results from a {@link IDataStoreORM} query.
   */
  take?: number
}

export type FindClaimsArgs = FindArgs<TClaimsColumns>
