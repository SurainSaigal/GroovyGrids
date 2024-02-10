import BottomBar from "./components/BottomBar";
import LoginButton from "./components/LoginButton";
import localFont from "next/font/local";

function Home() {
    return (
        <div className="flex flex-col justify-between items-center min-h-screen">
            <img className="w-80 md:w-1/2 mt-20" src="/assets/images/gg_logo.png" alt="Epic Logo" />
            <LoginButton />
            <BottomBar login={true} />
        </div>
    );
}

export default Home;
