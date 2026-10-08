# Backend

## Configuration

Set `MONGODB_URI` and a non-empty `JWT_SECRET` in the environment or a backend
`.env` file. Startup fails if `JWT_SECRET` is missing or blank. `PORT` defaults
to `7000`.

MongoDB must support transactions (a replica set or sharded cluster). Employee
creation, updates, and deactivation commit the linked User and Employee changes
in one transaction.

Install dependencies with `corepack yarn install --frozen-lockfile`, then start
with `corepack yarn start`.

## Vercel deployment

Set the Vercel project root directory to `backend`. The Express app is exported
as the serverless handler; do not configure a custom start command that runs
`app.listen()`.

Add `MONGODB_URI` and a non-empty `JWT_SECRET` to the Vercel project's
Environment Variables for each deployment environment. The MongoDB database
must allow connections from Vercel and support transactions. Configure
`INNGEST_EVENT_KEY` for event sending, plus `INNGEST_SIGNING_KEY` when syncing
the Inngest endpoint. Email reminders also require `SMTP_USER`, `SMTP_PASS`,
`SENDER_EMAIL`, and `ADMIN_EMAIL`.

After deployment, check the Vercel Function Logs for the invocation stack if a
function still fails. The API returns `503 Database unavailable` if it cannot
establish a MongoDB connection.

## Attendance actions

`POST /api/attendance` accepts `{ "action": "CHECK_IN" }` or
`{ "action": "CHECK_OUT" }`. An omitted action defaults to check-in. Repeated
check-ins return the existing record unchanged. An open shift is reused even
when it started on an earlier day; only an explicit check-out closes it.

## Regression tests

Run `corepack yarn test` from this directory. Tests use Node's built-in test
runner and a disposable MongoDB replica set provided by `mongodb-memory-server`.
The first run may download a MongoDB binary. Tests use synthetic local records
and do not connect to the configured application database.
