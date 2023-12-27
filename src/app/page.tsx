import React, { useEffect, useState } from "react";
import LoginButton from "./components/LoginButton";

function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center">
            <div>
                <LoginButton />
            </div>
        </main>
    );
}

export default Home;
