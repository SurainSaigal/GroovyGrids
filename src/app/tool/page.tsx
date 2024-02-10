"use client";
import React, { useEffect, useState } from "react";
import BottomBar from "../components/BottomBar";
import Loader from "../components/Loader";
import localFont from "next/font/local";
import { BiSolidRightArrow, BiSolidUpArrow } from "react-icons/bi";
import { FaRegSadTear } from "react-icons/fa";
import { useRouter } from "next/navigation";
import local from "next/font/local";

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
    const router = useRouter();
    if (typeof window !== "undefined" && localStorage.getItem("auth_token") === null) {
        router.push("/");
    }
    const [collageFailed, setCollageFailed] = useState<string | null>(null);
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
    const [isExpanded, setIsExpanded] = useState(false);
    let displayedItems;
    if (listData) {
        displayedItems = isExpanded ? listData : listData.slice(0, 3);
    }

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
                access_token: localStorage.getItem("auth_token"),
                length: length,
                type: type,
                format: thisFormat,
                name: localStorage.getItem("name"),
                date: localStorage.getItem("date"),
            }),
            signal: AbortSignal.timeout(40000),
        })
            .then((response) => {
                if (response.status === 409) {
                    throw new Error("Spotify API Error");
                }
                return response.json();
            })
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
                            setCollageFailed(null);
                            setImg(url);
                        }
                    });
            })
            .catch((error) => {
                //console.log("error name", error.message);
                if (error.name === "AbortError") {
                    setFailed(true);
                    console.log("retrying");
                    performFetch(thisFormat, display);
                } else if (error.message === "Spotify API Error") {
                    setCollageFailed(error);
                    setImg("failed");
                    if (typeof window !== "undefined") {
                        router.push("/");
                    }
                } else {
                    setCollageFailed(error);
                    setImg("failed");
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
                auth_token: localStorage.getItem("auth_token"),
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                setListData(data.infos);
            });
    };

    const fetchCollage = () => {
        setCollageFailed(null);
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
        const name = localStorage.getItem("name");
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
                        href={info.link}
                        target="_blank"
                        //onClick={() => window.open(info.link, "_blank")}
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
                <div className="md:w-1/2 md:ml-8 md:mr-8 mt-8 mb-4 md:mb-8 flex flex-col items-center">
                    {img && img !== "failed" ? (
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
                        !collageFailed && (
                            <div className="flex min-h-screen flex-col justify-center items-center">
                                <Loader />
                            </div>
                        )
                    )}
                    {failed && (
                        <>
                            <p className="mt-4">Taking longer than expected...</p>
                        </>
                    )}
                    {collageFailed && (
                        <div className="flex min-h-screen flex-col justify-center items-center">
                            <FaRegSadTear className="text-4xl text-gray-500" />
                            <p>Collage generation failed.</p>
                        </div>
                    )}
                    {img && img !== "failed" && (
                        <div>
                            <a
                                href={img ? img : "#"}
                                download={"groovy_grids_" + type + "_" + length + ".jpg"}
                            >
                                <button className="ml-5 mt-6 text-lg md:text-xl border-4 bg-[#01c4ff] text-white border-[#01c4ff] px-3 py-1 md:px-4 md:py-2 rounded-md hover:shadow-2xl hover:border-[#01b0e6]">
                                    Save Image
                                </button>
                            </a>
                        </div>
                    )}
                </div>
                <div className="md:w-1/2 mr-8 ml-8 md:mt-36 place-content-center min-h-screen items-center justify-center">
                    {/* <p>Collage Type</p>
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
                    </div> */}
                    <p className="md:mt-3">Length</p>
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
                    {/* <p className="mt-3">Format</p>
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
                    </div> */}

                    {displayedItems && (
                        <div className="flex flex-col">
                            <p className="mt-4">Click on an image or song title to view a song!</p>
                            <div
                                className={
                                    ClashDisplay.className +
                                    " text-center uppercase md:text-lg lg:text-2xl mt-3 mb-1"
                                }
                            >
                                {name}'s Top {type} - {timeToText[length]}
                            </div>
                            {displayedItems.map((item, index) => (
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
                            {!isExpanded && (
                                <button
                                    className="text-gray-500"
                                    onClick={() => setIsExpanded(true)}
                                >
                                    see all <BiSolidRightArrow className="inline-block mb-1" />
                                </button>
                            )}
                            {isExpanded && (
                                <button
                                    className="text-gray-500"
                                    onClick={() => setIsExpanded(false)}
                                >
                                    <BiSolidUpArrow className="inline-block mb-1" />
                                </button>
                            )}
                        </div>
                    )}
                    <div className="flex justify-center">
                        <img
                            className="w-20 mb-3 md:w-32 mt-6"
                            src="/assets/images/Spotify_Logo_RGB_Green.png"
                        ></img>
                    </div>
                </div>
            </div>
            <BottomBar login={false} />
        </div>
    );
};

export default TOOL;
