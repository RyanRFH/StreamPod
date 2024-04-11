import React, { useEffect, useState } from "react";
import { writeCookie } from "../common";
import '../App.css';

const randomstring = require("randomstring");
const jsCookie = require("js-cookie");



const Home = () => {
  let [liveStreamsList, setLiveStreamsList] = useState();
  let [allLiveStreamsList, setAllLiveStreamsList] = useState();
  let [user, setUser] = useState();
  let [selectedTab, setSelectedTab] = useState("Top"); //"Top" or "Followed"

  // console.log(user)
  // console.log(liveStreamsList);
  console.log(allLiveStreamsList);

  useEffect(() => {
    twitchGetFollowedChannels();
    twitchGetAllStreams();
    twitchGetAppAccessToken();
  }, []);


  //Create Twitch State String cookie -------------------------------------------------------------------

  let userTwitchStateString = jsCookie.get('TwitchStateString');
  //Check if cookie already exists
  if (!userTwitchStateString) {
    //Create cookie
    userTwitchStateString = randomstring.generate()
    document.cookie = writeCookie("TwitchStateString", userTwitchStateString, 30);
  }

  //------------------------------------------------------------------- Create Twitch State String cookie


  //Retrieve Twitch access token from URL -------------------------------------------------------------------

  //Get hash from url
  const urlParams = new URLSearchParams(document.location.hash);

  //Check if there are any params in URL
  if (urlParams.size > 0) {
    //Get token from URL
    const twitchAccessToken = urlParams.get("#access_token");

    //Create token cookie
    writeCookie("TwitchAccessToken", twitchAccessToken, 365);

  }

  //------------------------------------------------------------------- Retrieve user access token from URL

  const twitchGetAppAccessToken = async () => {
    let twitchAppAccessToken = jsCookie.get('TwitchAppAccessToken');

    if (twitchAppAccessToken) {
      return;
    }

    try {
      const res = await fetch(`https://id.twitch.tv/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: process.env.REACT_APP_TWITCH_CLIENT_ID,
          client_secret: process.env.REACT_APP_TWITCH_SECRET_ID,
          grant_type: "client_credentials"
        })
      });

      const data = await res.json();
      document.cookie = writeCookie("TwitchAppAccessToken", data.access_token, 30);
    } catch (error) {
      console.log(error)
    }
  }

  const twitchGetAllStreams = async () => {
    try {
      let twitchAppAccessToken = jsCookie.get('TwitchAppAccessToken');

      if (!twitchAppAccessToken) {
        return;
      }

      const res = await fetch(`https://api.twitch.tv/helix/streams`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${twitchAppAccessToken}`,
          "Client-Id": `${process.env.REACT_APP_TWITCH_CLIENT_ID}`
        },
      });

      const data = await res.json();
      setAllLiveStreamsList(data);
    } catch (error) {
      console.log(error)
    }
  }

  const twitchGetFollowedChannels = async () => {

    let twitchAccessToken = jsCookie.get('TwitchAccessToken');
    let userData;

    if (!twitchAccessToken) {
      return;
    }

    //Get user ID
    try {

      const res = await fetch(`https://api.twitch.tv/helix/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${twitchAccessToken}`,
          "Client-Id": `${process.env.REACT_APP_TWITCH_CLIENT_ID}`
        },
      });

      const user = await res.json();
      userData = user.data[0];
      setUser(userData);
    } catch (error) {
      console.log("error", error);
    }
    // console.log(userData);
    try {
      const res = await fetch(`https://api.twitch.tv/helix/streams/followed?user_id=${userData.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${twitchAccessToken}`,
          "Client-Id": `${process.env.REACT_APP_TWITCH_CLIENT_ID}`
        },
      });
      const data = await res.json();
      setLiveStreamsList(data);
    } catch (error) {
      console.log(error)
    }
  };

  const transformTwitchThumbURL = (url, width, height) => {
    //Replace placeholder words with pixel dimensions
    let newURL = url.replace("{width}", width);
    newURL = newURL.replace("{height}", height);
    return newURL;
  }

  const getStreamUpTime = (streamStartDate) => {
    // streamStartDate = "2024-04-09T04:31:32Z"

    streamStartDate = Date.parse(streamStartDate);


    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate())
    let currentDateUTC = Date.parse(currentDate.toUTCString());

    const upTimeInSeconds = (currentDateUTC - streamStartDate) / 1000;
    const upTimeHours = Math.trunc(upTimeInSeconds / 60 / 60);
    const upTimeMinutes = Math.trunc((upTimeInSeconds / 60) % 60);
    const upTimeSeconds = Math.trunc(upTimeInSeconds % 60);

    //Add leading 0's
    let minutesString = upTimeMinutes.toString();
    minutesString = minutesString.padStart(2, "0");

    let secondsString = upTimeSeconds.toString();
    secondsString = secondsString.padStart(2, "0");

    //Add 0 to start of minutes and seconds if only 1 num/char
    return `${upTimeHours}:${minutesString}:${secondsString}`;
  }

  const createStreamBlock = (stream, index) => {
    stream.thumbnail_url = transformTwitchThumbURL(stream.thumbnail_url, 400, 225);
    const streamUpTime = getStreamUpTime(stream.started_at);
    return (
      <div key={index} className="w-[400px] h-[400px] mb-[20px] mx-[20px]">

        <a href={`https://www.twitch.tv/${stream.user_login}`}>
          <div className="">
            <div className="relative hover:animate-pulse">
              <img src={stream.thumbnail_url} alt="thumbnail" className="mb-[5px]" />
              <p className="absolute bottom-4 left-4 text-white bg-black py-[3px] px-[5px] text-sm">{stream.viewer_count} viewers</p>
              <img src="/live-icon-streaming.png" alt="liveicon" className="absolute w-[75px] top-4 left-4" />
            </div>

            <h1 className="font-bold">{stream.title}</h1>
            <h1>{stream.user_name}</h1>
            <p>{stream.game_name}</p>
            <p>Uptime: {streamUpTime}</p>

          </div>

        </a >
      </div >

    )

  }


  return (
    <div className="mx-[50px] my-[20px] flex items-center justify-center flex-col">
      <div className="flex items-center justify-center bg-purple-300 rounded-3xl mb-[30px]">

        <div className="ml-[50px] flex items-center min-h-[150px] min-w-[300px]">
          <img src="/streampod-logo-zip-file/svg/logo-no-background.svg" alt="logo" className="w-[500px]" />
        </div>

        <div className="flex justify-around items-center w-full">
          {user ?
            <div className="flex items-center flex-col">
              <img src="Twitch_logo.svg" alt="twitchlogo" className="w-[100px]" />
              <p className="text-purple-700 font-bold mt-[5px]">{user.display_name}</p>
            </div>

            :
            <a href={`https://id.twitch.tv/oauth2/authorize?client_id=${process.env.REACT_APP_TWITCH_CLIENT_ID}&redirect_uri=http://localhost:3000/&response_type=token&scope=user%3Aread%3Afollows&state=${userTwitchStateString}`}>
              <div className="flex items-center flex-col">
                <img src="Twitch_logo.svg" alt="twitchlogo" className="w-[100px]" />
                <div className="bg-[#9146ff] p-[10px] rounded-xl mt-[10px] flex hover:bg-purple-500">
                  <img src="iconmonstr-twitch-1.svg" alt="twitchicon" className="mr-[10px]" />
                  Connect with twitch
                </div>
              </div>
            </a>
          }
        </div>
      </div>

      <div className="w-1/4 flex justify-around text-2xl mb-[30px]">
        <button className={`${selectedTab === "Top" && "c text-purple-500"}`} onClick={() => setSelectedTab("Top")}>Top</button>
        <button className={`${selectedTab === "Followed" && "c text-purple-500"}`} onClick={() => setSelectedTab("Followed")}>Followed</button>
      </div>


      <div className="flex justify-center items-center">
        {selectedTab === "Top" ?
          <div className="flex flex-wrap">
            {allLiveStreamsList ?
              allLiveStreamsList?.data.map((stream, index) => {
                return (
                  createStreamBlock(stream, index)
                )
              })
              :
              <p>Connect to see your followed streams</p>}
          </div>
          :
          <div className="flex flex-wrap">
            {liveStreamsList ?
              liveStreamsList?.data.map((stream, index) => {
                return (
                  createStreamBlock(stream, index)
                )
              })
              :
              <p>Connect to see your followed streams</p>}
          </div>
        }

      </div>



    </div>
  );
};

export default Home;
