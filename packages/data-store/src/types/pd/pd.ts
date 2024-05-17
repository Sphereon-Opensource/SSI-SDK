
export type PresentationDefinitionItem = {
    id: string
    tenantId?: string
    version: string
    purpose?: string
    definitionPayload: string
    createdAt: Date
    lastUpdatedAt: Date
}

export type NonPresentationDefinitionItem = Omit<PresentationDefinitionItem, 'id' | 'createdAt' | 'lastUpdatedAt'>
export type PartialPresentationDefinitionItem = Partial<PresentationDefinitionItem>