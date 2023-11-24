import { QueryRunner } from 'typeorm'
import { WithTypeOrmQuery } from '@sphereon/ssi-sdk.core'

export function createQueryRunnerAdapter(queryRunner: QueryRunner): WithTypeOrmQuery {
  return (query: string, parameters?: any[]) => {
    return queryRunner.query(query, parameters);
  };
}
