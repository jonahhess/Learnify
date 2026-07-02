# Learnify

Learnify is a one-stop shop for learning, understanding, and retaining just about anything! Choose a topic, read the text, quiz yourself, write summaries, review previous lessons. Take a course from our vast library, or generate your own using our AI course creator.

Design doc: https://docs.google.com/document/d/1kmmBUB7Wz0ZrTOQ5DWpmJNzvWbLYjprKO_jmeupGgpg/edit?tab=t.0

## API URL configuration for deploys

All frontend API calls now use `VITE_API_BASE_URL` from Vite env config.

- If `VITE_API_BASE_URL` is set, requests go to that URL.
- If it is unset, requests use relative paths (for example `/users/me`) so the built `dist` works behind the same host/reverse proxy.
- Local development should keep `VITE_API_BASE_URL` unset and use `VITE_DEV_API_PROXY_TARGET` in `.env.development` so Vite proxies API calls to your local backend.

### Local development (no CORS needed)

`.env.development`:

```bash
VITE_API_BASE_URL=
VITE_DEV_API_PROXY_TARGET=http://localhost:4000
```

In this setup:

- Browser requests stay same-origin in dev (`/users/login`, `/courses`, etc.).
- Vite forwards those requests to `VITE_DEV_API_PROXY_TARGET`.
- Your backend does not need localhost CORS entries for frontend development.

### Production

- Keep `VITE_API_BASE_URL` unset for same-origin deploys.
- Do not set `VITE_DEV_API_PROXY_TARGET` in production builds.
- Serve frontend and API behind the same host/reverse proxy.

Examples:

```bash
# build using same-origin relative API paths
npm run build

# build targeting a specific API host
VITE_API_BASE_URL=https://api.yourdomain.com npm run build
```
