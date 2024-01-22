"use client";
import React, { useEffect, useState } from "react";
import LogoutButton from "../components/LogoutButton";
import Loader from "../components/Loader";
import localFont from "next/font/local";

interface ImageResponse {
    link: string;
    title: string;
    coordinates: [number, number, number, number];
}

interface Dictionary {
    [key: string]: string;
}

const timeToText: Dictionary = {
    short_term: "Last Month",
    medium_term: "Last 6 Months",
    long_term: "All Time",
};
const ClashDisplay = localFont({ src: "../../../public/assets/fonts/ClashDisplay-Semibold.otf" });

const TOOL = () => {
    const [failed, setFailed] = useState(false);
    const [img, setImg] = useState<string | null>(null);
    const [type, setType] = useState("tracks");
    const [length, setLength] = useState("short_term");
    const [format, setFormat] = useState("INTERACT");
    const [windowDims, setWindowDims] = useState([0, 0]);
    const [dims, setDims] = useState([0, 0]);
    const [imageMapData, setImageMapData] = useState<ImageResponse[] | null>(null);
    const [imageMapDataDummy, setImageMapDataDummy] = useState<ImageResponse[] | null>(null);
    const [listData, setListData] = useState<[string, string][] | null>([]);
    const [name, setName] = useState<string>("");

    const [cachedImages, setCachedImages] = useState<Record<string, string | null>>({});
    const [cachedImageMaps, setCachedImageMaps] = useState<
        Record<string, [ImageResponse[], [number, number]]>
    >({});
    const cacheKey = `${type}_${length}_${format}`;

    const performFetch = (thisFormat: string, display: boolean) => {
        const fetchCacheKey = `${type}_${length}_${thisFormat}`;
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
                format: thisFormat,
                name: sessionStorage.getItem("name"),
                date: sessionStorage.getItem("date"),
            }),
            signal: AbortSignal.timeout(12000),
        })
            .then((response) => response.json())
            .then((data) => {
                setFailed(false);
                const imageResponses: ImageResponse[] = data.info;
                fetch(`data:image/jpeg;base64,${data.image}`)
                    .then((response) => response.blob())
                    .then((blob) => {
                        const url = URL.createObjectURL(blob);
                        setCachedImages((prevCachedImages) => ({
                            ...prevCachedImages,
                            [fetchCacheKey]: url,
                        }));
                        setCachedImageMaps((prevCachedImageMaps) => ({
                            ...prevCachedImageMaps,
                            [fetchCacheKey]: [imageResponses, data.dimensions],
                        }));
                        if (display) {
                            setDims(data.dimensions);
                            setImageMapDataDummy(imageResponses);
                            setImg(url);
                        }
                    });
            })
            .catch((error) => {
                setFailed(true);
                console.error("Fetch error:", error);
                if (error.name === "AbortError") {
                    console.log("retrying");
                    performFetch(thisFormat, display);
                }
            });

        if (display) {
            fetchList();
        }
    };

    const fetchList = () => {
        fetch("/node_api/getList", {
            method: "POST",
            body: JSON.stringify({
                item_type: type,
                time_range: length,
                auth_token: sessionStorage.getItem("auth_token"),
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                setListData(data.infos);
            });
    };

    const fetchCollage = () => {
        setImg(null);
        setImageMapData(null);
        setImageMapDataDummy(null);
        setListData(null);
        if (cachedImages[cacheKey] && cachedImageMaps[cacheKey]) {
            fetchList();
            setImageMapDataDummy(cachedImageMaps[cacheKey][0]);
            setDims(cachedImageMaps[cacheKey][1]);
            setImg(cachedImages[cacheKey]);
            return;
        }

        performFetch(format, true);

        const otherFormat = format === "INTERACT" ? "SHARE" : "INTERACT";
        performFetch(otherFormat, false);
    };

    useEffect(() => {
        const name = sessionStorage.getItem("name");
        if (name) {
            setName(name);
        }
        fetchCollage();
    }, [type, length, format]);

    const imageMap = (
        <map name="dynamicImageMap">
            {imageMapData &&
                imageMapData.map((info, index) => (
                    <area
                        key={index}
                        shape="rect"
                        coords={`${(info.coordinates[0] / dims[0]) * windowDims[0]}, ${
                            (info.coordinates[1] / dims[1]) * windowDims[1]
                        }, ${(info.coordinates[2] / dims[0]) * windowDims[0]}, ${
                            (info.coordinates[3] / dims[1]) * windowDims[1]
                        }`}
                        alt={info.title}
                        title={info.title}
                        className="hover:cursor-pointer"
                        onClick={() => window.open(info.link, "_blank")}
                    />
                ))}
        </map>
    );

    const handleImageLoad = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        const imageElement = document.getElementById("myImage");

        // Get the computed style of the image
        if (imageElement) {
            const computedStyle = window.getComputedStyle(imageElement);
            const wwidth = parseFloat(computedStyle.width);
            const wheight = parseFloat(computedStyle.height);
            setWindowDims([wwidth, wheight]);
        }
        setImageMapData(imageMapDataDummy);
    };

    return (
        <div className="">
            {/* <LogoutButton /> */}
            <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 md:ml-8 md:mr-8 mt-8 mb-8 flex flex-col items-center">
                    {img ? (
                        <div className="flex flex-col justify-start items-center">
                            <img
                                id="myImage"
                                className="object-fill"
                                src={img}
                                width={2040}
                                height={9080}
                                useMap="#dynamicImageMap"
                                alt="Collage"
                                onLoad={handleImageLoad}
                            />
                            {imageMap}
                        </div>
                    ) : (
                        <div className="flex min-h-screen flex-col justify-center items-center">
                            <Loader />
                        </div>
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
                    {img && (
                        <>
                            <a
                                href={img ? img : "#"}
                                download={"groovy_grids_" + type + "_" + length + ".jpg"}
                            >
                                <button className="mt-6 text-xl border-4 bg-spotify-green text-white border-spotify-green px-4 py-2 rounded-md hover:shadow-2xl hover:border-[#38c256]">
                                    Save Image
                                </button>
                            </a>

                            {navigator.share && (
                                <button
                                    className="mt-6 text-xl border-4 bg-spotify-green text-white border-spotify-green px-4 py-2 rounded-md hover:shadow-2xl hover:border-[#38c256]"
                                    onClick={async () => {
                                        navigator
                                            .share({
                                                files: [
                                                    new File(
                                                        [await (await fetch(img)).blob()],
                                                        "groovy_grids_" +
                                                            type +
                                                            "_" +
                                                            length +
                                                            ".jpg",
                                                        { type: "image/jpeg" }
                                                    ),
                                                ],
                                            })
                                            .then(() => console.log("Successfully shared"))
                                            .catch((error) =>
                                                console.error("Error sharing:", error)
                                            );
                                    }}
                                >
                                    Share
                                </button>
                            )}
                        </>
                    )}
                    {listData && (
                        <>
                            <div className={ClashDisplay.className + " uppercase text-2xl mt-3"}>
                                {name}'s Top {type} - {timeToText[length]}
                            </div>
                            {listData.map((item, index) => (
                                <div key={index}>
                                    <a
                                        href={item[1]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-purple-500"
                                    >
                                        {index + 1}. {item[0]}
                                    </a>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TOOL;
