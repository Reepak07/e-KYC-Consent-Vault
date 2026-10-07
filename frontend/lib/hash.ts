export async function hashFile(file: File): Promise<string> {
  const fileBuffer = await file.arrayBuffer();

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    fileBuffer
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));

  const hashHex =
    "0x" +
    hashArray
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

  return hashHex;
}