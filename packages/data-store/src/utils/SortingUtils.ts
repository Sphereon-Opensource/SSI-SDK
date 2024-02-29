import { BaseEntity, FindOptionsOrder } from 'typeorm'

export const parseAndValidateOrderOptions = <T extends BaseEntity>(order: string): FindOptionsOrder<T> => {
  const orderPairs = order.split(',').map((pair) => pair.trim().split('.'))
  const orderOptions: FindOptionsOrder<T> = {}

  orderPairs.forEach(([field, direction]) => {
    const dir = direction.toUpperCase()
    if (dir !== 'ASC' && dir !== 'DESC') {
      throw new Error(`Invalid order direction: '${direction}'. Must be 'asc' or 'desc'.`)
    }
    ;(orderOptions as any)[field] = dir
  })

  return orderOptions
}
