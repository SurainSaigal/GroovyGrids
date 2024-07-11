import BottomBar from "./components/BottomBar";
import LoginButton from "./components/LoginButton";
import localFont from "next/font/local";

function Home() {
    return (
        <div className="flex flex-col justify-between items-center min-h-screen">
            <div className="flex flex-col items-center md:mt-36 mt-52">
                <img
                    className="w-80 md:w-1/2 mt-20"
                    src="/assets/images/gg_logo.png"
                    alt="Groovy Grids Logo"
                />

                <p className="text-center mx-4 mb-10">
                    Visualize your listening habits, top albums, and artists.
                </p>
                <LoginButton />
            </div>
            <BottomBar login={true} />
        </div>
    );
}

export default Home;
