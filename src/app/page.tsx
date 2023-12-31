import LoginButton from "./components/LoginButton";

function Home() {
    // useEffect(() => {
    //     const res = fetch("/api/healthchecker")
    //         .then((response) => response.json())
    //         .then((data) => console.log(data));
    // }, []);
    return (
        <main className="flex min-h-screen flex-col items-center justify-center">
            <div>
                <LoginButton />
            </div>
        </main>
    );
}

export default Home;
