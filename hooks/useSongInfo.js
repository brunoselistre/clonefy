import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { currentTrackIdState } from "../atoms/songAtom";
import useSpotify from "../hooks/useSpotify";

function useSongInfo() {
    const spotifyApi = useSpotify();
    const [currentTrackId, setCurrentTrackId ] = useRecoilState(currentTrackIdState);
    const [songInfo, setSongInfo ] = useState(null);
    
    useEffect(() => {
        const fetchSongInfo = async () => {
            if (currentTrackId) {
                let url = `https:api.spotify.com/v1/tracks/${currentTrackId}`;
                let headers = { 
                    headers: { 
                        Authorization: `Bearer ${spotifyApi.getAccessToken()}`
                    }
                };
                const trackInfo = await fetch(url, headers).then((response) => response.json());
                setSongInfo(trackInfo);
            }
        };
        fetchSongInfo();

    }, [currentTrackId, spotifyApi])
    

    return songInfo;
}

export default useSongInfo;