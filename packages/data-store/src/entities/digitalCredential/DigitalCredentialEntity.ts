import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import {
  CredentialCorrelationType,
  CredentialDocumentFormat,
  CredentialStateType,
  DocumentType,
} from '../../types/digitalCredential/digitalCredential'
import { CredentialRole } from '../../types'

@Entity('DigitalCredential')
export class DigitalCredentialEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('simple-enum', { name: 'document_type', enum: DocumentType, nullable: false })
  documentType!: DocumentType

  @Column('simple-enum', { name: 'document_format', enum: CredentialDocumentFormat, nullable: false })
  documentFormat!: CredentialDocumentFormat

  @Column('simple-enum', { name: 'credential_role', enum: CredentialRole, nullable: false })
  credentialRole!: CredentialRole

  @Column('text', { name: 'raw_document', nullable: false })
  rawDocument!: string

  @Column('text', { name: 'uniform_document', nullable: false })
  uniformDocument!: string

  @Column('text', { name: 'credential_id', nullable: true, unique: false })
  credentialId!: string

  @Column('text', { name: 'hash', nullable: false, unique: true })
  hash!: string

  @Column('simple-enum', { name: 'issuer_correlation_type', enum: CredentialCorrelationType, nullable: false })
  issuerCorrelationType!: CredentialCorrelationType

  @Column('simple-enum', { name: 'subject_correlation_type', enum: CredentialCorrelationType, nullable: true })
  subjectCorrelationType?: CredentialCorrelationType

  @Column('text', { name: 'issuer_correlation_id', nullable: false })
  issuerCorrelationId!: string

  @Column('text', { name: 'subject_correlation_id', nullable: true })
  subjectCorrelationId?: string

  @Column('simple-enum', { name: 'verified_state', enum: CredentialStateType, nullable: true })
  verifiedState?: CredentialStateType

  @Column('text', { name: 'tenant_id', nullable: true })
  tenantId?: string

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt!: Date

  @UpdateDateColumn({ name: 'last_updated_at', nullable: false })
  lastUpdatedAt!: Date

  @Column('date', { name: 'valid_until', nullable: true })
  validUntil?: Date

  @Column('date', { name: 'valid_from', nullable: true })
  validFrom?: Date

  @Column('date', { name: 'verified_at', nullable: true })
  verifiedAt?: Date

  @Column('date', { name: 'revoked_at', nullable: true })
  revokedAt?: Date
}
