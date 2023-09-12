import { QueryRunner } from 'typeorm'

export async function enableUuidv4(queryRunner: QueryRunner) {
  try {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)
  } catch (error) {
    console.log(
      `Please enable the uuid-ossp.control extension in your postgresql installation. It enables generating V4 UUID and can be found in the postgresql-contrib package`
    )
    throw error
  }
}
