# Deployment Guide for Todo Minimal

This is a static web application (HTML, CSS, JavaScript) that connects to a Supabase backend. It requires no server-side rendering; the frontend runs entirely in the browser.

## Prerequisites

- **Docker** (for containerized deployment)
- **Docker Compose** (optional, for local development)
- A **Supabase project** with the schema applied (see `db/schema.sql`)

## Environment Variables

Create a `.env` file in the project root with the following variables (see `.env.example`):

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

These credentials must be injected into the frontend at runtime. The app expects them as `window.__SUPABASE_URL__` and `window.__SUPABASE_ANON_KEY__`. In a production setup, you can replace placeholders in `index.html` or use a build script.

## Deploy with Docker

1. Build the Docker image:
   ```bash
   docker build -t todo-minimal .
   ```

2. Run the container, passing environment variables:
   ```bash
   docker run -p 8080:8080 \
     -e SUPABASE_URL=https://your-project-ref.supabase.co \
     -e SUPABASE_ANON_KEY=your-anon-key-here \
     --name todo-minimal \
     todo-minimal
   ```

3. Open your browser to `http://localhost:8080`.

## Deploy with Docker Compose

1. Ensure your `.env` file is populated.

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. The app will be available at `http://localhost:8080`.

4. To stop:
   ```bash
   docker-compose down
   ```

## Deploy to Railway

1. Create a `railway.json` file (provided) in your project root.

2. Link your project:
   ```bash
   railway init
   ```

3. Set environment variables:
   ```bash
   railway variables set SUPABASE_URL=https://your-project-ref.supabase.co
   railway variables set SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. Deploy:
   ```bash
   railway up
   ```

## Deploy to Render

1. Create a new **Static Site** on Render.

2. Connect your Git repository.

3. Set the build command to `echo "No build step"` and publish directory to `/`.

4. Add environment variables in the Render dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

5. Deploy.

## Database Migrations

The app uses Supabase as its backend. Before deploying, apply the database schema:

1. Go to your Supabase project SQL editor.
2. Run the contents of `db/schema.sql`.
3. Optionally, run `db/seed.sql` for sample data (update the placeholder user_id).

## Testing

Before deployment, you can run the provided tests:

```bash
npm test
```

This requires installing dependencies (`npm install --save-dev vitest jsdom @vitest/globals`).

## Notes

- The app is a static Single Page Application (SPA). All routing is client-side.
- The nginx configuration includes security headers and caching for static assets.
- The Docker image uses a non-root user for security.
- Ensure your Supabase project has Row Level Security (RLS) enabled and the correct policies applied.