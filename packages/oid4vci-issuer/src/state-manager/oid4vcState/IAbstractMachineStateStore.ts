import { StateType } from '@sphereon/oid4vci-common'
import { Oid4vcStateEntity } from '@sphereon/ssi-sdk.data-store'

export interface IOid4vcStateStore<StateType> {
  persistOid4vcState(args: Oid4vcStateStoreParams<StateType>): Promise<Oid4vcStatePersisted<StateType>>

  findOid4vcStates(args: StoreOid4vcFindActiveArgs): Promise<Array<Oid4vcStatePersisted<StateType>>>

  getOid4vcState(args: StoreOid4vcGetArgs): Promise<Oid4vcStatePersisted<StateType>>

  deleteOid4vcState(args: StoreOid4vcDeleteArgs): Promise<boolean>

  deleteExpiredOid4vcStates(args: StoreOid4vcDeleteExpiredArgs): Promise<number>
}

export type StoreMachineStatePersistArgs<StateType> = Omit<Oid4vcStateStoreParams<StateType>, 'createdAt' | 'updatedAt'>

export type StoreOid4vcFindActiveArgs = Partial<Pick<Oid4vcStateStoreParams<StateType>, 'expiresAt' | 'tenantId' | 'stateId'>>

export type FindMachineStatesFilterArgs = Array<Partial<Omit<Oid4vcStateStoreParams<StateType>, 'state'>>>

export type StoreFindMachineStatesArgs = {
  filter: FindMachineStatesFilterArgs
}

export type StoreOid4vcGetArgs = Pick<Oid4vcStateEntity<StateType>, 'id' | 'stateId' | 'correlationId' | 'lookups' | 'tenantId'>
export type Oid4vcStateStore<StateType> = Pick<Oid4vcStateEntity<StateType>, 'id' | 'stateId' | 'correlationId' | 'lookups'>

export type StoreOid4vcDeleteArgs = StoreOid4vcGetArgs
export type StoreOid4vcDeleteExpiredArgs = {
  id?: string
  correlationId?: string
  sessionId?: string
  lookups?: Array<string>
  tenantId?: string
}

export type Oid4vcStatePersisted<StateType> = {
  id: string
  stateId?: string
  correlationId?: string
  type: string
  state: StateType
  lookups?: Array<string>
  createdAt: Date
  lastUpdatedAt: Date
  expiresAt?: Date
  tenantId?: string
}

export type Oid4vcStateStoreParams<StateType> = Omit<Oid4vcStatePersisted<StateType>, 'id'>
