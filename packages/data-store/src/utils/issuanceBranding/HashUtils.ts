/**
 * Computes a compact hash suitable for change detection in branding data.
 * Uses FNV-1a 64-bit hash algorithm with base36 encoding for a compact representation.
 *
 * Output format: ~11 characters (base36 encoded 64-bit hash)
 * Example: "3qvf8n2kl9x"
 *
 * This is significantly smaller than SHA256+base64 (44 chars) while maintaining
 * sufficient collision resistance for this use case.
 *
 * @param input - The string to hash
 * @returns A compact hash string (~11 characters)
 */

// FNV-1a 64-bit hash constants
const FNV_PRIME = 0x100000001b3n
const OFFSET_BASIS = 0xcbf29ce484222325n

export function computeCompactHash(input: string): string {
  let hash = OFFSET_BASIS

  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i))
    hash = (hash * FNV_PRIME) & 0xffffffffffffffffn // Keep it 64-bit
  }

  // Convert to base36 for compact representation
  // Base36 uses 0-9 and a-z, URL-safe and case-insensitive friendly
  return hash.toString(36)
}
