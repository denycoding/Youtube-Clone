import { useState, useEffect } from "react";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import VideoCard from "./VideoCard";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

function App() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch popular videos
  async function fetchPopularVideos() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=12&regionCode=IN&key=${API_KEY}`,
      );

      if (!response.ok) {
        throw new Error("Unable to fetch videos. Check your API key.");
      }

      const data = await response.json();

      setVideos(data.items || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Search videos
  async function handleSearch(query) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q=${encodeURIComponent(query)}&regionCode=IN&key=${API_KEY}`,
      );

      const data = await response.json();

      if (!response.ok) {
        console.log("YouTube API Error:", data);
        throw new Error(data.error?.message || "YouTube API request failed");
      }

      setVideos(data.items || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Load popular videos on first render
  useEffect(() => {
    fetchPopularVideos();
  }, []);

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      {/* Navbar */}
      <Navbar onSearch={handleSearch} />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-5 overflow-y-auto">
          {loading && (
            <div className="text-center text-lg font-semibold">
              Loading videos...
            </div>
          )}

          {error && (
            <div className="text-center text-red-500 font-semibold">
              {error}
            </div>
          )}

          {!loading && !error && videos.length === 0 && (
            <div className="text-center text-gray-500">No videos found.</div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {videos.map((video) => (
                <VideoCard
                  key={
                    typeof video.id === "string" ? video.id : video.id.videoId
                  }
                  video={video}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
