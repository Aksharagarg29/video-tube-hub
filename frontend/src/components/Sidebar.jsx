import { NavLink } from "react-router-dom";

// Each item: the text shown, the path it links to, and a simple emoji icon
// (keeps things simple instead of pulling in an icon library)
const links = [
  { label: "Home", to: "/", icon: "🏠" },
  { label: "Liked Videos", to: "/liked", icon: "👍" },
  { label: "History", to: "/history", icon: "🕘" },
  { label: "My content", to: "/videos", icon: "🎬" },
  { label: "Playlists", to: "/playlists", icon: "📁" },
  { label: "Subscriptions", to: "/subscribers", icon: "👥" },
];

export default function Sidebar() {
  return (
    <aside className="w-[220px] shrink-0 p-3 flex flex-col gap-1 border-r border-border">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm hover:bg-surface " +
            (isActive ? "border-border bg-surface" : "border-transparent")
          }
        >
          <span>{link.icon}</span>
          <span>{link.label}</span>
        </NavLink>
      ))}
    </aside>
  );
}
