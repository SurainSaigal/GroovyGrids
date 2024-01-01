"use client";
import React, { useRef, useEffect, useState } from "react";
import LogoutButton from "../components/LogoutButton";
import Loader from "../components/Loader";

const TOOL = () => {
    const [failed, setFailed] = useState(false);
    const [img, setImg] = useState<string | null>(null);

    const [type, setType] = useState("tracks");
    const [length, setLength] = useState("short_term");
    const [format, setFormat] = useState("SHARE");

    const [cachedImages, setCachedImages] = useState<Record<string, string | null>>({});
    const cacheKey = `${type}_${length}_${format}`;

    const performFetch = () => {
        fetch("/api/collage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Origin: process.env.NEXT_PUBLIC_URI || "home",
            },
            body: JSON.stringify({
                access_token: sessionStorage.getItem("auth_token"),
                length: length,
                type: type,
                format: format,
                name: sessionStorage.getItem("name"),
            }),
            signal: AbortSignal.timeout(12000),
        })
            .then((response) => response.blob())
            .then((blob) => {
                setFailed(false);
                const url = URL.createObjectURL(blob);
                setCachedImages((prevCachedImages) => ({
                    ...prevCachedImages,
                    [cacheKey]: url,
                }));
                setImg(url);
            })
            .catch((error) => {
                setFailed(true);
                console.error("Fetch error:", error);
                if (error.name === "AbortError") {
                    console.log("retrying");
                    performFetch();
                }
            });
    };

    const fetchCollage = () => {
        setImg(null);

        if (cachedImages[cacheKey]) {
            setImg(cachedImages[cacheKey]);
            return;
        }

        performFetch();

        const otherFormat = format === "INTERACT" ? "SHARE" : "INTERACT";
        fetch("/api/collage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Origin: process.env.NEXT_PUBLIC_URI || "home",
            },
            body: JSON.stringify({
                access_token: sessionStorage.getItem("auth_token"),
                length: length,
                type: type,
                format: otherFormat,
                name: sessionStorage.getItem("name"),
            }),
        })
            .then((response) => response.blob())
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                setCachedImages((prevCachedImages) => ({
                    ...prevCachedImages,
                    [`${type}_${length}_${otherFormat}`]: url,
                }));
            });
    };
    useEffect(() => {
        fetchCollage();
    }, [type, length, format]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [img]);

    return (
        <div className="">
            {/* <LogoutButton /> */}
            <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 md:ml-8 md:mr-8 mt-8 mb-8 flex min-h-screen flex-col items-center justify-center">
                    {img ? (
                        <img className="object-fill" src={img} alt="Received Image" />
                    ) : (
                        <>
                            <Loader />
                        </>
                    )}
                    {failed && (
                        <>
                            <p className="mt-4">Taking longer than expected...</p>
                        </>
                    )}
                </div>
                <div className="md:w-1/2 mr-8 ml-8 md:mt-36 place-content-center min-h-screen items-center justify-center">
                    <p>Collage Type</p>
                    <div>
                        <button
                            className={
                                "w-1/2 text-xl border-4 px-4 py-2 rounded-l-lg " +
                                (type === "tracks" ? "bg-[#01c4ff] border-[#01b0e6]" : "")
                            }
                            onClick={() => {
                                if (img) {
                                    setType("tracks");
                                }
                            }}
                        >
                            Tracks
                        </button>
                        <button
                            className={
                                "w-1/2 text-xl border-4 px-4 py-2 rounded-r-lg " +
                                (type === "artists" ? "bg-[#01c4ff] border-[#01b0e6]" : "")
                            }
                            onClick={() => {
                                if (img) {
                                    setType("artists");
                                }
                            }}
                        >
                            Artists
                        </button>
                    </div>
                    <p className="mt-3">Length</p>
                    <div className="">
                        <button
                            className={
                                "text-xl w-1/3 border-4 px-4 py-2 rounded-l-lg " +
                                (length === "short_term" ? "border-[#da47a9] bg-[#f24fbc]" : "")
                            }
                            onClick={() => {
                                if (img) {
                                    setLength("short_term");
                                }
                            }}
                        >
                            Last Month
                        </button>
                        <button
                            className={
                                "text-xl w-1/3 border-4 px-4 py-2 " +
                                (length === "medium_term" ? "border-[#da47a9] bg-[#f24fbc]" : "")
                            }
                            onClick={() => {
                                if (img) {
                                    setLength("medium_term");
                                }
                            }}
                        >
                            Last 6 Months
                        </button>
                        <button
                            className={
                                "text-xl w-1/3 border-4 px-4 py-2 rounded-r-lg " +
                                (length === "long_term" ? "border-[#da47a9] bg-[#f24fbc]" : "")
                            }
                            onClick={() => {
                                if (img) {
                                    setLength("long_term");
                                }
                            }}
                        >
                            All Time
                        </button>
                    </div>
                    <p className="mt-3">Format</p>
                    <div className="">
                        <button
                            className={
                                "text-xl w-1/2 border-4 px-4 py-2 rounded-l-lg " +
                                (format === "INTERACT" ? "border-[#38c256] bg-spotify-green" : "")
                            }
                            onClick={() => {
                                if (img) {
                                    setFormat("INTERACT");
                                }
                            }}
                        >
                            All
                        </button>
                        <button
                            className={
                                "text-xl w-1/2 border-4 px-4 py-2 rounded-r-lg " +
                                (format === "SHARE" ? "border-[#38c256] bg-spotify-green" : "")
                            }
                            onClick={() => {
                                if (img) {
                                    setFormat("SHARE");
                                }
                            }}
                        >
                            Shareable
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TOOL;
