
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit

export async function POST(request: NextRequest) {
  try {
    const jwt = process.env.PINATA_JWT;

    if (!jwt) {
      return NextResponse.json(
        { error: "Pinata is not configured. Check frontend/.env.local." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file was provided." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The selected file is empty." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds the 10 MB upload limit." },
        { status: 413 }
      );
    }

    const pinataForm = new FormData();
    pinataForm.append("file", file, file.name);

    const pinataResponse = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        body: pinataForm,
        cache: "no-store",
      }
    );

    const responseText = await pinataResponse.text();

    let result: {
      IpfsHash?: string;
      message?: string;
    };

    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }

    if (!pinataResponse.ok || !result.IpfsHash) {
      console.error(
        "Pinata upload failed:",
        pinataResponse.status,
        result.message ?? "Unknown error"
      );

      return NextResponse.json(
        { error: "Pinata upload failed. Check your JWT and Pinata permissions." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      cid: result.IpfsHash,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    });
  } catch (error) {
    console.error("IPFS upload route error:", error);

    return NextResponse.json(
      { error: "Unexpected error while uploading the file to IPFS." },
      { status: 500 }
    );
  }
}
