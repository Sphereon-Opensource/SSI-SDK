import { StatusListResult } from '@sphereon/ssi-sdk.vc-status-list'
import { IStatusListDriver, StatusListManagementOptions } from '@sphereon/ssi-sdk.vc-status-list-issuer-drivers'
import { OrPromise } from '@sphereon/ssi-types'
import { DataSource } from 'typeorm'

export type StatusListInstance = StatusListManagementOptions & { dataSource?: OrPromise<DataSource>; issuer?: string }

export interface IDriverAndStatusListResult {
  slDriver: IStatusListDriver
  statusList: Pick<StatusListResult, 'id' | 'correlationId' | 'type'>
}
