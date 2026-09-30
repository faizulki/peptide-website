# Peptide Sales Shop Project

A full-stack peptide sales platform with separate frontend, admin panel, and backend applications.

## Project Structure

```
product-website/
├── frontend/          # Next.js frontend for customers
├── admin-panel/       # Next.js admin panel for management
└── backend/           # NestJS backend API
```

## Getting Started

### Frontend (Customer-facing)
```bash
cd frontend
npm run dev
```
Runs on http://localhost:3000

### Admin Panel
```bash
cd admin-panel
npm run dev
```
Runs on http://localhost:3000 (use different port if frontend is running)

### Backend API
```bash
cd backend
npm run start:dev
```
Runs on http://localhost:3000 (default NestJS port)

## Technology Stack

- **Frontend & Admin Panel**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript

## Deployment

Each application is designed to be deployed on separate domains:
- Frontend: Customer-facing domain
- Admin Panel: Admin domain
- Backend: API domain

Production runs the `docker-compose.yml` stack (with Caddy for TLS) on a
single server. Pushing to `main` deploys it via GitHub Actions
(`.github/workflows/deploy.yml`):

1. Finds the running stack's directory, compose project and env file from
   its container labels, so existing volumes and `.env` keep being used.
2. Backs up the deployment files to `/var/backups/peptide-deploy` (last 5).
3. Rsyncs the code over — `.env`, the database and uploads are never touched.
4. Builds the images, restarts the stack, and health-checks all three apps,
   rolling back to the previous images if they don't come up.

Run it manually from the Actions tab with **dry run** checked to preview what
would change on the server without deploying.

Required secrets (in the `production` environment): `SSH_HOST`, `SSH_USER`,
`SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`; optional `SSH_PORT` (default 22) and
`DEPLOY_PATH` (a safety check that the running stack is where you expect).
Production environment variables live only in `.env` on the server.

