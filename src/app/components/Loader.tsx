import { useEffect } from "react";

export default function Loader() {
    useEffect(() => {
        async function getLoader() {
            const { waveform } = await import("ldrs");
            waveform.register();
        }
        getLoader();
    }, []);
    return <l-waveform size="50" stroke="5" speed="1" color="#3ed760"></l-waveform>;
}
