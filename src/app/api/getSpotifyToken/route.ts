import { NextResponse } from "next/server";
import * as Buffer from "buffer";

interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}

export async function POST(request: Request) {
    try {
        const { state, code } = await request.json();

        if (!process.env.NEXT_PUBLIC_URI) {
            throw new Error("Invalid redirect uri");
        }
        const requestBody = new URLSearchParams();
        requestBody.append("code", code);
        requestBody.append("redirect_uri", process.env.NEXT_PUBLIC_URI + "callback");
        requestBody.append("grant_type", "authorization_code");

        const headers1 = {
            "content-type": "application/x-www-form-urlencoded",
            Authorization:
                "Basic " +
                Buffer.Buffer.from(
                    process.env.NEXT_PUBLIC_CLIENT_ID + ":" + process.env.CLIENT_SECRET
                ).toString("base64"),
        };

        const response = await fetch(`https://accounts.spotify.com/api/token`, {
            method: "POST",
            headers: headers1,
            body: requestBody.toString(),
        });

        if (!response.ok) {
            throw new Error(`Failed to get access token. Status: ${response.status}`);
        }

        const data: TokenResponse = await response.json();
        const profileResponse = await fetch(`https://api.spotify.com/v1/me`, {
            headers: {
                Authorization: "Bearer " + data.access_token,
            },
        });

        const profile = await profileResponse.json();
        return NextResponse.json({
            token: data.access_token,
            refresh_token: data.refresh_token,
            name: profile.display_name,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error }, { status: 400 });
    }
}
