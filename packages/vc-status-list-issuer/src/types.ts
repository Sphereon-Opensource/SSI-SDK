import { StatusListManagementOptions } from '@sphereon/ssi-sdk.vc-status-list-issuer-drivers'
import { OrPromise } from '@sphereon/ssi-types'
import { DataSource } from 'typeorm'

export type StatusListInstance = StatusListManagementOptions & { dataSource?: OrPromise<DataSource>; issuer?: string }
