import { CreateContacts1659463079429 } from './1-CreateContacts'
import { CreateContacts1690925872318 } from './2-CreateContacts'
import { CreateIssuanceBranding1659463079429 } from './2-CreateIssuanceBranding'
import { CreateStatusList1693866470000 } from './3-CreateStatusList'

/**
 * The migrations array that SHOULD be used when initializing a TypeORM database connection.
 *
 * These ensure the correct creation of tables and the proper migrations of data when tables change between versions.
 *
 * @public
 */

// Individual migrations per purpose. Allows parties to not run migrations and thus create/update tables if they are not using a particular feature (yet)
export const DataStoreContactMigrations = [CreateContacts1659463079429, CreateContacts1690925872318]
export const DataStoreIssuanceBrandingMigrations = [CreateIssuanceBranding1659463079429]
export const DataStoreStatusListMigrations = [CreateStatusList1693866470000]

// All migrations together
export const DataStoreMigrations = [...DataStoreContactMigrations, ...DataStoreIssuanceBrandingMigrations, ...DataStoreStatusListMigrations]
