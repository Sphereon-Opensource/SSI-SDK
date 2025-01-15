import { IStatusList } from './IStatusList'
import { StatusList2021Implementation } from './StatusList2021'
import { OAuthStatusListImplementation } from './OAuthStatusList'
import { StatusListType } from '@sphereon/ssi-types'

export class StatusListFactory {
  private static instance: StatusListFactory
  private implementations: Map<StatusListType, IStatusList>

  private constructor() {
    this.implementations = new Map()
    this.implementations.set(StatusListType.StatusList2021, new StatusList2021Implementation())
    this.implementations.set(StatusListType.OAuthStatusList, new OAuthStatusListImplementation())
  }

  public static getInstance(): StatusListFactory {
    if (!StatusListFactory.instance) {
      StatusListFactory.instance = new StatusListFactory()
    }
    return StatusListFactory.instance
  }

  public getImplementation(type: StatusListType): IStatusList {
    const implementation = this.implementations.get(type)
    if (!implementation) {
      throw new Error(`No implementation found for status list type: ${type}`)
    }
    return implementation
  }

  // Optional: Method to register custom implementations if needed
  public registerImplementation(type: StatusListType, implementation: IStatusList): void {
    this.implementations.set(type, implementation)
  }
}

export function getStatusListImplementation(type: StatusListType): IStatusList {
  return StatusListFactory.getInstance().getImplementation(type)
}
