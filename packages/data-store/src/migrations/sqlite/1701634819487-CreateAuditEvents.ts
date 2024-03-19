import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateAuditEvents1701634819487 implements MigrationInterface {
  name = 'CreateAuditEvents1701634819487'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "AuditEvents" ("id" varchar PRIMARY KEY NOT NULL, "timestamp" datetime NOT NULL, "level" varchar CHECK( "level" IN ('0','1','2','3') ) NOT NULL, "correlationId" varchar NOT NULL, "system" varchar CHECK( "system" IN ('general','kms','identity','oid4vci','credentials','web3','profile','contact') ) NOT NULL, "subSystemType" varchar CHECK( "subSystemType" IN ('key','did_provider','did_resolver','oid4vp_op','oid4vci_client','siopv2_op','contact_manager','vc_issuer','vc_verifier','vc_persistence','transport','profile') ) NOT NULL, "actionType" varchar CHECK( "actionType" IN ('create','read','update','delete','execute') ) NOT NULL, "actionSubType" varchar NOT NULL, "initiatorType" varchar CHECK( "initiatorType" IN ('user','system','external') ) NOT NULL, "systemCorrelationIdType" varchar CHECK( "systemCorrelationIdType" IN ('did','email','hostname','phone','user') ), "systemCorrelationId" varchar, "systemAlias" varchar, "partyCorrelationType" varchar CHECK( "partyCorrelationType" IN ('did','email','hostname','phone') ), "partyCorrelationId" varchar, "partyAlias" varchar, "description" varchar NOT NULL, "data" varchar, "diagnosticData" varchar, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "AuditEvents"`)
  }
}
