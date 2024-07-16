import { NextResponse } from "next/server";

interface ListRequest {
    item_type: string;
    time_range: string;
    auth_token: string;
}

export async function POST(request: Request) {
    try {
        const req: ListRequest = await request.json();

        const req_url =
            "https://api.spotify.com/v1/me/top/" +
            req.item_type +
            "?" +
            "limit=50" +
            "&offset=0" +
            "&time_range=" +
            req.time_range;

        const header = {
            Authorization: "Bearer " + req.auth_token,
            "Content-Type": "application/json",
        };

        const response = await fetch(req_url, {
            method: "GET",
            headers: header,
        });

        const data = await response.json();

        const items = data.items;
        let infos = [];
        if (req.item_type === "tracks") {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const artists = item.artists;
                let title = item.name + " - ";
                for (let j = 0; j < artists.length; j++) {
                    title += artists[j].name;
                    if (j < artists.length - 1) {
                        title += ", ";
                    }
                }
                infos.push([title, item.external_urls.spotify]);
            }
        } else {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                let title = item.name;
                infos.push([title, item.external_urls.spotify]);
            }
        }

        return NextResponse.json({ infos: infos });
    } catch (error: any) {
        return NextResponse.json({ error: error }, { status: 400 });
    }
}
