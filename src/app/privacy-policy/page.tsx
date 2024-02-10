// basic outline for a privacy policy page
import BottomBar from "../components/BottomBar";
function PrivacyPolicy() {
    return (
        <main className="flex min-h-screen flex-col justify-between items-center">
            <p className="text-center text-4xl font-bold mt-20">Groovy Grids Privacy Policy</p>
            <div className="flex flex-col mt-10 mb-10 w-full md:w-1/2">
                <p className="text-center ml-2 mr-2">
                    Groovy Grids is a web application that allows user's to create and share
                    collages based on their Spotify listening history. By using Groovy Grids, you
                    allow us to access your Spotify account username as well as your top tracks and
                    artists.
                </p>
                <p className="text-center ml-2 mr-2 mt-4">
                    Groovy Grids does not store or share any of your personal or Spotify data with
                    third parties. All data is used ONLY for the purpose of generating your collages
                    and is not stored afterwards. Though we do not store your data, you can still
                    revoke our access to your Spotify data at any time by visiting your Spotify
                    account settings.
                </p>
            </div>
            <BottomBar login={false} />
        </main>
    );
}

export default PrivacyPolicy;
