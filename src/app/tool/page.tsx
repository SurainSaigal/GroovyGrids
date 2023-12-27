"use client";
import React, { useEffect, useState } from "react";
import LogoutButton from "../components/LogoutButton";

const TOOL = () => {
    const [name, setName] = useState<string>("");
    const [img, setImg] = useState<string | null>(null);
    useEffect(() => {
        setName(sessionStorage.getItem("name") || "user");

        fetch("http://127.0.0.1:5000/api/collage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                access_token: sessionStorage.getItem("auth_token"),
                length: "medium_term",
                type: "tracks",
            }),
        })
            .then((response) => response.blob())
            .then((blob) => {
                setImg(URL.createObjectURL(blob));
            });
    }, []);

    return (
        <div>
            <LogoutButton />
            {img && <img src={img} alt="Received Image" />}
        </div>
    );
};

export default TOOL;
