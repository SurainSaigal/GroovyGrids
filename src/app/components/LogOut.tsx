"use client";

const onLogOut = () => {
    const url = "https://accounts.spotify.com/en/logout/";
    const spotifyLogoutWindow = window.open(
        url,
        "Spotify Logout",
        "width=700,height=500,top=40, left=40"
    );
    if (spotifyLogoutWindow) {
        setTimeout(() => {
            spotifyLogoutWindow.close();
            window.location.href = "/";
        }, 2000);
    }
    localStorage.clear();
};

const LogOut = () => {
    return (
        <a className="cursor-pointer" onClick={onLogOut}>
            log out
        </a>
    );
};

export default LogOut;
