"use client";
import LoginHandler from "../node_api/login";

import styles from "./button.module.css";

const LoginButton = () => {
    return (
        <button
            className="text-xl bg-spotify-green text-white border border-spotify-green px-4 py-2 rounded-md hover:shadow-2xl hover:shadow-spotify-green"
            onClick={LoginHandler}
        >
            Log in with Spotify.
        </button>
        // <div className={styles.button}>
        //     <a href="#">Log in with Spotify</a>
        // </div>
    );
};

export default LoginButton;
