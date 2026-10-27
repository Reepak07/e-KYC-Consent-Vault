
import { keccak256 } from "ethers";

/**
 * Calculates the keccak256 hash of the exact file bytes.
 * Returns a 0x-prefixed 32-byte hexadecimal string.
 */
export async function hashFile(file: File): Promise<string> {
  const fileBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(fileBuffer);

  return keccak256(fileBytes);
}
