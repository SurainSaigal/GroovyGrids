"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "../components/Loader";

const Callback = () => {
    const [token, setToken] = useState(false);
    const [error, setError] = useState("");
    const query = useSearchParams();
    const code = query.get("code");
    let state = query.get("state");

    useEffect(() => {
        const fetchToken = async () => {
            try {
                if (localStorage.getItem("spotifyAuthState") !== state) {
                    throw new Error("AuthState mismatch.");
                }
                const requestBody = {
                    code: code,
                    state: state,
                };
                const response = await fetch(`/node_api/getSpotifyToken`, {
                    method: "POST",
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error. Status: ${response.status}`);
                }

                const data = await response.json();
                localStorage.setItem("auth_token", data.token);
                localStorage.setItem("name", data.name);

                const formatDate = () => {
                    const date = new Date();
                    const mm = String(date.getMonth() + 1).padStart(2, "0"); // Month is zero-based
                    const dd = String(date.getDate()).padStart(2, "0");
                    const yy = String(date.getFullYear()).slice(-2);
                    const dateString = `${mm}/${dd}/${yy}`;
                    localStorage.setItem("date", dateString);
                };
                formatDate();

                setToken(true);
            } catch (error: any) {
                setError(error);
            }
        };
        fetchToken();
    }, [code, state]);

    const router = useRouter();
    useEffect(() => {
        if (token) {
            router.push("/tool");
        }
    }, [token, router]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            {error !== "" ? "" + error : <Loader />}
        </div>
    );
};

export default Callback;
