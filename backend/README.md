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
