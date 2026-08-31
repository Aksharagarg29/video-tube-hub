import { useEffect, useRef, useState } from "react";
import ProfileEditor from "./ProfileEditor";
import PasswordEditor from "./PasswordEditor";

export default function AccountSettings({
    user,
    onProfileUpdate,
    refreshUser
}) {
    const [activeSection, setActiveSection] = useState(null);

    const containerRef = useRef(null);

    function toggleSection(section) {
        setActiveSection((prev) =>
            prev === section ? null : section
        );
    }

    // -------------------------
    // OUTSIDE CLICK
    // -------------------------

    useEffect(() => {
        function handleOutsideClick(e) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target)
            ) {
                setActiveSection(null);
            }
        }

        if (activeSection) {
            document.addEventListener(
                "mousedown",
                handleOutsideClick
            );
        }

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, [activeSection]);

    return (
        <div
            ref={containerRef}
            className="w-full border border-border rounded-xl p-6 mb-8 bg-surface"
        >

            <h2 className="text-lg font-semibold">
                Account settings
            </h2>

            <p className="text-muted text-sm mt-1 mb-5">
                Manage your profile and account.
            </p>

            {/* BUTTONS */}

            <div className="flex flex-wrap gap-3">

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                        toggleSection("profile")
                    }
                >
                    Edit profile
                </button>

                <button
                    type="button"
                    className="btn"
                    onClick={() =>
                        toggleSection("password")
                    }
                >
                    Change password
                </button>

            </div>

            {/* PROFILE */}

            {activeSection === "profile" && (
                <div className="mt-5">

                    <ProfileEditor
                        user={user}
                        refreshUser={refreshUser}
                        onCancel={() =>
                            setActiveSection(null)
                        }
                        onSuccess={(newUserName) => {
                            setActiveSection(null);
                            onProfileUpdate?.(newUserName);
                        }}
                    />

                </div>
            )}

            {/* PASSWORD */}

            {activeSection === "password" && (
              <div className="mt-5">

                  <PasswordEditor
                      user={user}
                      onCancel={() =>
                          setActiveSection(null)
                      }
                      onSuccess={() => {
                          setActiveSection(null);
                      }}
                  />

              </div>
          )}

        </div>
    );
}