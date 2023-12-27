"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LogoutButton = () => {
    const router = useRouter();
    return (
        <div className="absolute top-5 right-5">
            <button
                className="text-xl bg-cyan-400 text-white border border-cyan-400 px-4 py-2 rounded-md hover:shadow-2xl hover:shadow-cyan-400"
                onClick={() => router.replace("/")}
            >
                Log out.
            </button>
        </div>
    );
};

export default LogoutButton;
