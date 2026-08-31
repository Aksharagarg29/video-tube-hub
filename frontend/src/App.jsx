import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Watch from "./pages/Watch";
import Channel from "./pages/Channel";
import LikedVideos from "./pages/LikedVideos";
import Search from "./pages/Search";
import History from "./pages/History";
import MyVideos from "./pages/MyVideos";
import Playlists from "./pages/Playlists";
import PlaylistDetail from "./pages/PlaylistDetail";
import Subscribers from "./pages/Subscribers";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>

        <Routes>

          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route path="/signup" element={<Signup />} />

          <Route
            path="/watch/:videoId"
            element={<Watch />}
          />

          <Route
            path="/channel/:userName"
            element={<Channel />}
          />

          <Route
            path="/liked"
            element={<LikedVideos />}
          />

          <Route path="/search" element={<Search />} />

          <Route path="/history" element={<History />} />

          <Route path="/videos" element={<MyVideos />} />

          <Route path="/playlists" element={<Playlists />} />

          <Route
            path="/playlists/:playlistId"
            element={<PlaylistDetail />}
          />

          <Route path="/subscribers" element={<Subscribers />} />

          <Route path="*" element={<NotFound />} />

        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
}
