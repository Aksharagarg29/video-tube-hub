import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

// This wraps every page: navbar on top, optional sidebar on the left,
// and whatever page content is passed in as "children".
export default function Layout({
  children,
  showSidebar = true,
  onUploadVideo,
}) {
  return (
    <div>
      <Navbar onUploadVideo={onUploadVideo} />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className="flex-1 p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
