import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateAuditEvents1701634819487 implements MigrationInterface {
  name = 'CreateAuditEvents1701634819487'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "AuditEvents" (
                "id" varchar PRIMARY KEY NOT NULL,
                "eventType" varchar CHECK( "eventType" IN ('audit','activity','general') ) NOT NULL,
                "timestamp" datetime NOT NULL, 
                "level" varchar CHECK( "level" IN ('0','1','2','3','4') ) NOT NULL, 
                "correlationId" varchar NOT NULL, 
                "system" varchar CHECK( "system" IN ('general','kms','identity','oid4vci','oid4vp','siopv2','PE','credentials','web3','profile','contact') ) NOT NULL, 
                "subSystemType" varchar CHECK( "subSystemType" IN ('key','did_provider','did_resolver','oid4vp_op','oid4vci_client','siopv2_op','contact_manager','vc_issuer','vc_verifier','vc_persistence','transport','profile','api') ) NOT NULL, 
                "actionType" varchar CHECK( "actionType" IN ('create','read','update','delete','execute') ) NOT NULL, 
                "actionSubType" varchar NOT NULL, 
                "initiatorType" varchar CHECK( "initiatorType" IN ('user','system','external') ) NOT NULL, 
                "systemCorrelationIdType" varchar CHECK( "systemCorrelationIdType" IN ('did','url','email','hostname','phone','user') ), 
                "systemCorrelationId" varchar, 
                "systemAlias" varchar, 
                "partyCorrelationType" varchar CHECK( "partyCorrelationType" IN ('did','url','email','hostname','phone') ), 
                "partyCorrelationId" varchar, 
                "partyAlias" varchar,
                "credentialType" varchar CHECK( "credentialType" IN ('JSON_LD','JWT','SD_JWT','MSO_MDOC') ),
                "credentialHash" varchar,
                "parentCredentialHash" varchar,
                "originalCredential" varchar,
                "sharePurpose" varchar,
                "description" varchar NOT NULL, 
                "data" varchar, 
                "diagnosticData" varchar, 
                "created_at" datetime NOT NULL DEFAULT (datetime('now')), 
                "last_updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "AuditEvents"`)
  }
}
