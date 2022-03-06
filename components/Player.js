import { useSession } from "next-auth/react";
import { useRecoilState } from "recoil";
import { currentTrackIdState, isPlayingState } from "../atoms/songAtom";
import useSpotify from "../hooks/useSpotify";
import useSongInfo from "../hooks/useSongInfo";
import { useCallback, useEffect, useState } from "react";
import { debounce } from "lodash";
import { VolumeOffIcon, VolumeUpIcon, RefreshIcon, HeartIcon } from "@heroicons/react/outline";
import { RewindIcon, FastForwardIcon, PauseIcon, PlayIcon, SwitchHorizontalIcon } from "@heroicons/react/solid";

function Player() {
    const spotifyApi = useSpotify();
    const { data: session, status } =  useSession();
    const [currentTrackId, setCurrentTrackId ] = useRecoilState(currentTrackIdState);
    const [isPlaying, setIsPlaying ] = useRecoilState(isPlayingState);
    const [volume, setVolume ] = useState(50);
    const [isShuffling, setIsShuffling ] = useState(false);
    const [repeat, setRepeat ] = useState(false);
    const songInfo = useSongInfo();

    const fetchCurrentSong = () => {
        if(!songInfo) {
            spotifyApi.getMyCurrentPlayingTrack().then(data => {
                console.log("Now playing: ", data.body?.item);
                setCurrentTrackId(data.body?.item?.id);

                spotifyApi.getMyCurrentPlaybackState().then(data => {setIsPlaying(data.body?.is_playing);});
            });
        }
    };

    useEffect(() => {
        if(spotifyApi.getAccessToken() && !currentTrackId) {
            fetchCurrentSong();
            setVolume(50);
        }
    }, [currentTrackIdState, spotifyApi, session]);

    useEffect(() => {
        if(volume > 0 && volume < 100) {
            debounceAdjustVolume(volume)
        }
    }, [volume]);

    

    const debounceAdjustVolume = useCallback(
        debounce((volume) => {
            spotifyApi.setVolume(volume).catch(err => {console.log(err)});
        }, 500), []
    ); 

    const handlePlayPause = () => {
        spotifyApi.getMyCurrentPlaybackState().then((data) => {
            if(data.body?.is_playing) {
                spotifyApi.pause();
                setIsPlaying(false);
            }
            else{
                spotifyApi.play();
                setIsPlaying(true);
            }
        })
    }

    const handleShuffle = () => {
        if(isShuffling) {
            setIsShuffling(false);
            spotifyApi.setShuffle(false)
        }else {
            setIsShuffling(true);
            spotifyApi.setShuffle(true);
        } 
    }

    const handleRepeat = () => {
        if(repeat) {
            console.log(repeat);
            setRepeat(false);
            spotifyApi.setRepeat('off');
        }else {
            console.log(repeat);
            setRepeat(true);
            spotifyApi.setRepeat('track');
        } 
    }
    
    return ( 
        <div className="h-24 bg-gradient-to-b from-black to-gray-900 text-white grid grid-cols-3 text-xs md:text-base px-2 md:px-8"> 
            {/*Left panel*/}
            <div className="flex items-center space-x-4">
                <img className="hidden md:inline h-10 w-10" src={songInfo?.album.images?.[0]?.url} alt=""/>
                <div>
                    <h3 className="bold">{songInfo?.name}</h3>
                    <p className="text-gray-500">{songInfo?.artists.map(artist => artist?.name).join(', ')}</p>
                </div>
                <HeartIcon className="button"/>
            </div>

            {/*Center pane*/}
            <div className="flex item-center justify-evenly mt-10">
                <SwitchHorizontalIcon className="button" onClick={handleShuffle}/>
                <RewindIcon className="button"  onClick={() => spotifyApi.skipToPrevious()}/>
                {isPlaying ? <PauseIcon className="button h-10 w-10 -mt-2" onClick={handlePlayPause} /> : <PlayIcon className="button h-10 w-10 -mt-2" onClick={handlePlayPause}/>}
                <FastForwardIcon className="button" onClick={() => {spotifyApi.skipToNext()}}/>
                <RefreshIcon className="button" onClick={handleRepeat}/>
            </div>

            { /* Right pane*/}
            <div className="flex items-center space-x-3 md:space-x-4 justify-end pr-5">
                <VolumeOffIcon className="button" onClick={() => volume > 0 ? setVolume(volume - 10) : setVolume(volume)}/>
                <input className="w-14 md:w-28" type="range" value={volume} onChange={(e) => setVolume(Number(e.target.value))} min={0} max={100}/>
                <VolumeUpIcon className="button" onClick={() => volume < 100 ? setVolume(volume + 10) : setVolume(volume)}/>
            </div>
        </div>
     );
}

export default Player;