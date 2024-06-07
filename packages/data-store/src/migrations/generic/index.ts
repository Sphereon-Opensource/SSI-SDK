import { CreateContacts1659463079429 } from './1-CreateContacts'
import { CreateIssuanceBranding1659463079429 } from './2-CreateIssuanceBranding'
import { CreateContacts1690925872318 } from './3-CreateContacts'
import { CreateStatusList1693866470000 } from './4-CreateStatusList'
import { CreateAuditEvents1701635835330 } from './5-CreateAuditEvents'
import { CreateDigitalCredential1708525189000 } from './6-CreateDigitalCredential'
import { CreateMachineStateStore1708098041262 } from './7-CreateMachineStateStore'
import { CreateContacts1708525189000 } from './8-CreateContacts'
import { CreateContacts1715761125000 } from './9-CreateContacts'
import { CreatePresentationDefinitions1716533767523 } from './10-CreatePresentationDefinitions'

/**
 * The migrations array that SHOULD be used when initializing a TypeORM database connection.
 *
 * These ensure the correct creation of tables and the proper migrations of data when tables change between versions.
 *
 * @public
 */

// Individual migrations per purpose. Allows parties to not run migrations and thus create/update tables if they are not using a particular feature (yet)
export const DataStoreContactMigrations = [
  CreateContacts1659463079429,
  CreateContacts1690925872318,
  CreateContacts1708525189000,
  CreateContacts1715761125000,
]
export const DataStoreIssuanceBrandingMigrations = [CreateIssuanceBranding1659463079429]
export const DataStoreStatusListMigrations = [CreateStatusList1693866470000]
export const DataStoreEventLoggerMigrations = [CreateAuditEvents1701635835330]
export const DataStoreDigitalCredentialMigrations = [CreateDigitalCredential1708525189000]
export const DataStoreMachineStateMigrations = [CreateMachineStateStore1708098041262]
export const DataStorePresentationDefinitionMigrations = [CreatePresentationDefinitions1716533767523]

// All migrations together
export const DataStoreMigrations = [
  ...DataStoreContactMigrations,
  ...DataStoreIssuanceBrandingMigrations,
  ...DataStoreStatusListMigrations,
  ...DataStoreEventLoggerMigrations,
  ...DataStoreDigitalCredentialMigrations,
  ...DataStoreMachineStateMigrations,
  ...DataStorePresentationDefinitionMigrations,
]
