"use client";
const LogOut = () => {
    return (
        <a href="/" onClick={() => localStorage.clear()}>
            log out
        </a>
    );
};

export default LogOut;
