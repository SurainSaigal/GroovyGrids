"use client";
import LoginHandler from "../api/login";

const LoginButton = () => {
    return (
        <button
            className="text-xl bg-spotify-green text-white border border-spotify-green px-4 py-2 rounded-md hover:shadow-2xl hover:shadow-spotify-green"
            onClick={LoginHandler}
        >
            Log in with Spotify.
        </button>
    );
};

export default LoginButton;
