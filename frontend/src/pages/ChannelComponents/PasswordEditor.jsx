import { useState } from "react";
import { changePassword } from "../../api/userApi";

export default function PasswordEditor({
    user,
    onCancel,
    onSuccess,
}) {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // --------------------------------
    // GOOGLE ACCOUNT
    // --------------------------------

    if (user?.authProvider === "google") {
        return (
            <div className="border border-border rounded-xl p-5">

                <h3 className="font-semibold text-base mb-4">
                    Change password
                </h3>

                <div className="p-4 rounded-lg border border-border bg-bg">
                    <p className="font-medium">
                        Google Sign-In account
                    </p>

                    <p className="text-muted text-sm mt-2">
                        This account uses Google Sign-In.
                        Password changes aren't available
                        because your password is managed by Google.
                    </p>
                </div>

                <div className="flex gap-3 mt-5">

                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn"
                    >
                        Cancel
                    </button>

                </div>

            </div>
        );
    }

    // --------------------------------
    // LOCAL ACCOUNT
    // --------------------------------

    async function handleSubmit(e) {
        e.preventDefault();

        setError("");

        if (!oldPassword || !newPassword) {
            setError(
                "Both current password and new password are required."
            );
            return;
        }

        if (newPassword.length < 6) {
            setError(
                "New password must be at least 6 characters."
            );
            return;
        }

        setLoading(true);

        try {
            await changePassword({
                oldPassword,
                newPassword,
            });

            setOldPassword("");
            setNewPassword("");

            onSuccess?.();

        } catch (err) {
            console.error(
                "PASSWORD CHANGE ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Could not change password."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="border border-border rounded-xl p-5">

            <h3 className="font-semibold text-base mb-4">
                Change password
            </h3>

            {/* ERROR */}

            {error && (
                <div className="mb-4 p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>

                <div className="grid gap-4 max-w-xl">

                    {/* CURRENT PASSWORD */}

                    <div className="field">

                        <label>
                            Current password
                        </label>

                        <input
                            className="input"
                            type="password"
                            value={oldPassword}
                            onChange={(e) =>
                                setOldPassword(e.target.value)
                            }
                            placeholder="Enter current password"
                        />

                    </div>

                    {/* NEW PASSWORD */}

                    <div className="field">

                        <label>
                            New password
                        </label>

                        <input
                            className="input"
                            type="password"
                            value={newPassword}
                            onChange={(e) =>
                                setNewPassword(e.target.value)
                            }
                            placeholder="Enter new password"
                        />

                    </div>

                </div>

                {/* BUTTONS */}

                <div className="flex gap-3 mt-5">

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        {loading
                            ? "Changing..."
                            : "Change password"}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="btn"
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    );
}