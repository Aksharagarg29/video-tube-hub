import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function NotFound() {
  return (
    <Layout showSidebar={false}>
      <div className="flex flex-col items-center justify-center text-center py-24">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-semibold mb-2">Page not found</h1>
        <p className="text-muted mb-5">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to home
        </Link>
      </div>
    </Layout>
  );
}
