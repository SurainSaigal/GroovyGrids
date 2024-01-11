interface ListRequest {
    item_type: string;
    time_range: string;
    auth_token: string;
}

export async function POST(request: Request) {
    const req: ListRequest = await request.json();

    const req_url =
        "https://api.spotify.com/v1/me/top/" +
        req.item_type +
        "?" +
        "limit=100" +
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
    console.log(data);
}
