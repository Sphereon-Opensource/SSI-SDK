import {
  AddElectronicAddressArgs,
  AddIdentityArgs,
  AddPartyArgs,
  AddPartyTypeArgs,
  AddPhysicalAddressArgs,
  AddRelationshipArgs,
  ElectronicAddress,
  GetElectronicAddressArgs,
  GetElectronicAddressesArgs,
  GetIdentitiesArgs,
  GetIdentityArgs,
  GetPartiesArgs,
  GetPartyArgs,
  GetPartyTypeArgs,
  GetPartyTypesArgs,
  GetPhysicalAddressArgs,
  GetPhysicalAddressesArgs,
  GetRelationshipArgs,
  GetRelationshipsArgs,
  Identity,
  Party,
  PartyRelationship,
  PartyType,
  PhysicalAddress,
  RemoveElectronicAddressArgs,
  RemoveIdentityArgs,
  RemovePartyArgs,
  RemovePartyTypeArgs,
  RemovePhysicalAddressArgs,
  RemoveRelationshipArgs,
  UpdateElectronicAddressArgs,
  UpdateIdentityArgs,
  UpdatePartyArgs,
  UpdatePartyTypeArgs,
  UpdatePhysicalAddressArgs,
  UpdateRelationshipArgs,
} from '../types'

export abstract class AbstractContactStore {
  abstract getParty(args: GetPartyArgs): Promise<Party>
  abstract getParties(args?: GetPartiesArgs): Promise<Array<Party>>
  abstract addParty(args: AddPartyArgs): Promise<Party>
  abstract updateParty(args: UpdatePartyArgs): Promise<Party>
  abstract removeParty(args: RemovePartyArgs): Promise<void>
  abstract getIdentity(args: GetIdentityArgs): Promise<Identity>
  abstract getIdentities(args?: GetIdentitiesArgs): Promise<Array<Identity>>
  abstract addIdentity(args: AddIdentityArgs): Promise<Identity>
  abstract updateIdentity(args: UpdateIdentityArgs): Promise<Identity>
  abstract removeIdentity(args: RemoveIdentityArgs): Promise<void>
  abstract getRelationship(args: GetRelationshipArgs): Promise<PartyRelationship>
  abstract getRelationships(args?: GetRelationshipsArgs): Promise<Array<PartyRelationship>>
  abstract addRelationship(args: AddRelationshipArgs): Promise<PartyRelationship>
  abstract updateRelationship(args: UpdateRelationshipArgs): Promise<PartyRelationship>
  abstract removeRelationship(args: RemoveRelationshipArgs): Promise<void>
  abstract getPartyType(args: GetPartyTypeArgs): Promise<PartyType>
  abstract getPartyTypes(args?: GetPartyTypesArgs): Promise<Array<PartyType>>
  abstract addPartyType(args: AddPartyTypeArgs): Promise<PartyType>
  abstract updatePartyType(args: UpdatePartyTypeArgs): Promise<PartyType>
  abstract removePartyType(args: RemovePartyTypeArgs): Promise<void>
  abstract getElectronicAddress(args: GetElectronicAddressArgs): Promise<ElectronicAddress>
  abstract getElectronicAddresses(args?: GetElectronicAddressesArgs): Promise<Array<ElectronicAddress>>
  abstract addElectronicAddress(args: AddElectronicAddressArgs): Promise<ElectronicAddress>
  abstract updateElectronicAddress(args: UpdateElectronicAddressArgs): Promise<ElectronicAddress>
  abstract removeElectronicAddress(args: RemoveElectronicAddressArgs): Promise<void>
  abstract getPhysicalAddress(args: GetPhysicalAddressArgs): Promise<PhysicalAddress>
  abstract getPhysicalAddresses(args?: GetPhysicalAddressesArgs): Promise<Array<PhysicalAddress>>
  abstract addPhysicalAddress(args: AddPhysicalAddressArgs): Promise<PhysicalAddress>
  abstract updatePhysicalAddress(args: UpdatePhysicalAddressArgs): Promise<PhysicalAddress>
  abstract removePhysicalAddress(args: RemovePhysicalAddressArgs): Promise<void>
}
