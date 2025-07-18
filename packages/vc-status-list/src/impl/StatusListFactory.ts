import type { IStatusList } from './IStatusList'
import { StatusList2021Implementation } from './StatusList2021'
import { OAuthStatusListImplementation } from './OAuthStatusList'
import { StatusListType } from '@sphereon/ssi-types'
import { BitstringStatusListImplementation } from './BitstringStatusListImplementation'

export class StatusListFactory {
  private static instance: StatusListFactory
  private implementations: Map<StatusListType, IStatusList>

  private constructor() {
    this.implementations = new Map()
    this.implementations.set(StatusListType.StatusList2021, new StatusList2021Implementation())
    this.implementations.set(StatusListType.OAuthStatusList, new OAuthStatusListImplementation())
    this.implementations.set(StatusListType.BitstringStatusList, new BitstringStatusListImplementation())
  }

  public static getInstance(): StatusListFactory {
    if (!StatusListFactory.instance) {
      StatusListFactory.instance = new StatusListFactory()
    }
    return StatusListFactory.instance
  }

  public getByType(type: StatusListType): IStatusList {
    const statusList = this.implementations.get(type)
    if (!statusList) {
      throw new Error(`No implementation found for status list type: ${type}`)
    }
    return statusList
  }
}

export function getStatusListImplementation(type: StatusListType): IStatusList {
  return StatusListFactory.getInstance().getByType(type)
}
