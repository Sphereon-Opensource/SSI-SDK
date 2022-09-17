/**
 * It expresses how the inputs are presented as proofs to a Verifier.
 */
export interface PresentationSubmission {
  /**
   * A UUID or some other unique ID to identify this Presentation Submission
   */
  id: string
  /**
   * A UUID or some other unique ID to identify this Presentation Definition
   */
  definition_id: string
  /**
   * List of descriptors of how the claims are being mapped to presentation definition
   */
  descriptor_map: Array<Descriptor>
}

/**
 * descriptor map laying out the structure of the presentation submission.
 */
export interface Descriptor {
  /**
   * ID to identify the descriptor from Presentation Definition Input Descriptor it coresponds to.
   */
  id: string
  /**
   * The path where the verifiable credential is located in the presentation submission json
   */
  path: string
  path_nested?: Descriptor
  /**
   * The Proof or JWT algorith that the proof is in
   */
  format: string
}
