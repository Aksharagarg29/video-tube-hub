# VideoTube

A full-stack video-sharing app (YouTube/Twitter-hybrid): videos, comments,
likes, tweets, playlists, subscriptions, and a creator dashboard.

- **Backend:** Node.js, Express, MongoDB/Mongoose, Cloudinary, JWT auth (local
  + Google Sign-In)
- **Frontend:** React (Vite), React Router, Tailwind CSS v4, axios

## Project structure

```
videotube/
  backend/     Express API (see backend/src for controllers/models/routes/etc.)
  frontend/    React app (Vite)
```

## Prerequisites

- Node.js 18+
- A MongoDB instance (local or Atlas)
- A Cloudinary account (for video/image uploads)
- A Google OAuth 2.0 Client ID (only needed if you want "Continue with Google" to work)

```

The API starts on `http://localhost:8000` (or whatever `PORT` you set), with
routes mounted under `/api/v1/...` (e.g. `/api/v1/videos`,
`/api/v1/users/login`).

Generate strong random values for `ACCESS_TOKEN_SECRET` and
`REFRESH_TOKEN_SECRET`, for example:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```

The app starts on `http://localhost:5173` by default. Make sure
`CORS_ORIGIN` in `backend/.env` matches this exactly.

## Notes on what's implemented

- **Auth:** email/password (with bcrypt + JWT access/refresh tokens in
  httpOnly cookies) and Google Sign-In, sharing the same account if the
  emails match.
- **Videos:** upload (multipart, stored via Cloudinary), publish/unpublish,
  edit, delete, view counting, watch history, search (`?query=`), sorting.
- **Social:** comments (with likes), video/comment/tweet likes, tweets,
  subscriptions, a channel page with public/owner views.
- **Playlists:** create, view, add/remove videos, delete.
- **Dashboard:** channel stats (subscribers, videos, views, likes) and a
  channel's video list, for the logged-in owner.

