import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";

// "My content" in the sidebar links here. Video management (upload, edit,
// publish/unpublish, delete) already lives on the channel page, so this
// just routes the logged-in user there instead of duplicating that UI.
export default function MyVideos() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <p className="text-muted">Loading...</p>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/channel/${user.userName}`} replace />;
}
