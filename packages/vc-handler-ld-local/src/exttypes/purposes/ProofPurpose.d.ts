export = ProofPurpose

export interface IDcProofPurpose {
  term: string
  date: string | Date | number
  maxTimestampDelta?: number
}

declare class ProofPurpose {
  /**
   * @param term {string} the `proofPurpose` term, as defined in the
   *    SECURITY_CONTEXT_URL `@context` or a URI if not defined in such.
   * @param [date] {string or Date or integer} the expected date for
   *   the creation of the proof.
   * @param [maxTimestampDelta] {integer} a maximum number of seconds that
   *   the date on the signature can deviate from, defaults to `Infinity`.
   */
  constructor({ term: String, date: Date, maxTimestampDelta }: IDcProofPurpose = {} as IDcProofPurpose)
  term: string
  date: string | Date | number
  maxTimestampDelta: any
  /**
   * Called to validate the purpose of a proof. This method is called during
   * proof verification, after the proof value has been checked against the
   * given verification method (e.g. in the case of a digital signature, the
   * signature has been cryptographically verified against the public key).
   *
   * @param proof {object} the proof, in the `constants.SECURITY_CONTEXT_URL`,
   *   with the matching purpose to validate.
   *
   * @return {Promise<object>} resolves to an object with `valid` and `error`.
   */
  validate(proof: object, {}: {}): Promise<object>
  /**
   * Called to update a proof when it is being created, adding any properties
   * specific to this purpose. This method is called prior to the proof
   * value being generated such that any properties added may be, for example,
   * included in a digital signature value.
   *
   * @param proof {object} the proof, in the `constants.SECURITY_CONTEXT_URL`
   *   to update.
   *
   * @return {Promise<object>} resolves to the proof instance (in the
   *   `constants.SECURITY_CONTEXT_URL`.
   */
  update(proof: object, {}: {}): Promise<object>
  /**
   * Determines if the given proof has a purpose that matches this instance,
   * i.e. this ProofPurpose instance should be used to validate the given
   * proof.
   *
   * @param proof {object} the proof to check.
   *
   * @return {Promise<boolean>} `true` if there's a match, `false` if not.
   */
  match(proof: object, {}: {}): Promise<boolean>
}
