"use client";
import querystring from "querystring";

function generateRandomString(length: number) {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function LoginHandler() {
    const state = generateRandomString(16);
    localStorage.setItem("spotifyAuthState", state);
    const scope = "user-top-read user-read-private user-read-email";

    const authorizationUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
        response_type: "code",
        client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
        scope: scope,
        redirect_uri: process.env.NEXT_PUBLIC_URI + "callback",
        state: state,
        show_dialog: "true",
    })}`;
    window.location.href = authorizationUrl;
}

export default LoginHandler;
