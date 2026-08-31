import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function Signup() {
  const [form, setForm] = useState({
    fullName: "",
    userName: "",
    email: "",
    password: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!avatar) {
      setError("Please choose a profile photo (avatar) — it's required.");
      return;
    }

    setLoading(true);
    try {
      // The backend expects multipart/form-data because of the file uploads
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("userName", form.userName);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("avatar", avatar);
      if (coverImage) formData.append("coverImage", coverImage);

      await signup(formData);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Could not sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        className="w-full max-w-[380px] bg-surface border border-border rounded-lg p-8"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center gap-2 font-bold mb-6">
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] text-white bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500">
            VT
          </span>
          <span>VIDEO-TUBE-HUB</span>
        </div>
        <h1 className="m-0 mb-1 text-[22px]">Sign up</h1>
        <p className="m-0 mb-6 text-muted text-sm">Create your VIDEO-TUBE-HUB account.</p>

        {error && (
          <p className="bg-danger/10 border border-danger text-danger px-3 py-2.5 rounded-lg text-[13px] mb-4">
            {error}
          </p>
        )}

        <div className="field">
          <label>Full name</label>
          <input
            className="input"
            required
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Username</label>
          <input
            className="input"
            required
            value={form.userName}
            onChange={(e) => updateField("userName", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Email</label>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            className="input"
            type="password"
            required
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Avatar (required)</label>
          <input
            className="input"
            type="file"
            accept="image/*"
            required
            onChange={(e) => setAvatar(e.target.files[0])}
          />
        </div>

        <div className="field">
          <label>Cover image (optional)</label>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files[0])}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-border flex-1"></div>
          <span className="text-xs text-muted">OR</span>
          <div className="h-px bg-border flex-1"></div>
        </div>

        <GoogleLoginButton
          onSuccess={() => navigate("/")}
          onError={(message) => setError(message)}
        />

        <p className="mt-5 text-[13px] text-muted text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
