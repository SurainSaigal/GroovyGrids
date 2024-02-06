import Link from "next/link";
import LogOut from "./LogOut";
interface BottomBarProps {
    login: boolean;
}

const BottomBar: React.FC<BottomBarProps> = ({ login }) => {
    return (
        <div className="relative bottom-0 w-full mb-4">
            <div className="flex justify-center">
                {!login && (
                    <>
                        <p className="text-blue-500 text-sm">
                            <Link href="/tool">home </Link>
                        </p>
                        <p className="text-gray-500 text-sm ml-1"> | </p>
                    </>
                )}
                <p className="text-blue-500 text-sm ml-1">
                    <Link href="/privacy-policy">privacy policy</Link>
                </p>
                {!login && (
                    <>
                        <p className="text-gray-500 text-sm ml-1"> | </p>
                        <p className="text-blue-500 text-sm ml-1">
                            <LogOut />
                        </p>
                    </>
                )}
            </div>
            <div className="flex justify-center">
                <p className="text-gray-500 text-sm ml-1"> © 2024 groovy grids </p>
                <p className="text-gray-500 text-sm ml-1"> | </p>
                <p className="text-gray-500 text-sm ml-1">
                    {" "}
                    made by{" "}
                    <a
                        className="text-blue-500"
                        href="https://github.com/SurainSaigal"
                        target="_blank"
                    >
                        surain saigal
                    </a>
                </p>
            </div>
        </div>
    );
};

export default BottomBar;
