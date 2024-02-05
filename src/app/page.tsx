import BottomBar from "./components/BottomBar";
import LoginButton from "./components/LoginButton";
import localFont from "next/font/local";

const ClashDisplay = localFont({
    src: "../../public/assets/fonts/ClashDisplay-Semibold.otf",
});
function Home() {
    return (
        <div className="flex flex-col justify-between items-center min-h-screen">
            <p className={ClashDisplay.className + " text-7xl mt-20 mb-4 self-center"}>
                Groovy Grids
            </p>
            <LoginButton />
            <BottomBar login={true} />
        </div>
    );
}

export default Home;
