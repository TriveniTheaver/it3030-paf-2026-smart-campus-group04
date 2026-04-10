# Smart Campus Operations Hub (IT3030 PAF)

Spring Boot REST API + React (Vite) client for facility bookings, incident ticketing, notifications, and OAuth-style authentication.

## Prerequisites

- **JDK 23** (see `backend/pom.xml`; CI uses the same)
- **Maven 3.9+**
- **Node.js 20+** and npm

## Backend

From the `backend` directory:

```bash
mvn clean verify
```

Run the API (default port **8081**):

```bash
cd web-app
mvn spring-boot:run
```

Configuration: `backend/web-app/src/main/resources/application.yml` (MySQL by default).

- **Default DB**: MySQL at `jdbc:mysql://localhost:3306/smartcampus` (see env vars `SMARTCAMPUS_DB_URL`, `SMARTCAMPUS_DB_USERNAME`, `SMARTCAMPUS_DB_PASSWORD`)
- **Local override**: `backend/web-app/src/main/resources/application-local.yml` is imported automatically (gitignored) and can override secrets like DB password.
- **Schema**: `spring.jpa.hibernate.ddl-auto=update` (creates/updates tables automatically for dev)

### Google Sign-In (`invalid_client` / OAuth client not found)

By default the committed config **does not** register Google OAuth (so you are not sent to Google with invalid client IDs). To enable it, create a **Web application** OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and either:

- Copy `backend/web-app/src/main/resources/application-local.yml.example` to **`application-local.yml`** and replace the `YOUR_…` values with your real client id and secret, or  
- Set **`SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID`** and **`SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET`** in the environment.

Add **Authorized redirect URI**: `http://localhost:8081/login/oauth2/code/google`. If the consent screen is in **Testing**, add your Gmail under **Test users**.

### Seeded accounts (development)

| Email            | Password    | Role        |
|------------------|------------|-------------|
| admin@sliit.lk   | password123 | ADMIN      |
| tech@sliit.lk    | password123 | TECHNICIAN |
| it12345678@my.sliit.lk | password123 | USER |

## Frontend

From the `frontend` directory:

```bash
npm install
npm run dev
```

Vite dev server proxies `/api` to `http://localhost:8081` (see `frontend/vite.config.js`).

## Member 1 — Facilities catalogue & resource management

**REST API (base path `/api/facilities`)**

| Method | Path | Description | Access |
|--------|------|-------------|--------|
| GET | `/api/facilities` | List resources; optional query params `type`, `minCapacity`, `location` | Public |
| GET | `/api/facilities/{id}` | Resource by id | Public |
| POST | `/api/facilities` | Create resource | ADMIN |
| PUT | `/api/facilities/{id}` | Update resource | ADMIN |
| DELETE | `/api/facilities/{id}` | Delete resource | ADMIN |

Create/update bodies use `ResourceRequest` with server-side validation (name, type, capacity, location, status, optional availability window and image URL). Validation errors return HTTP **400** with JSON `{ "message": "Validation failed", "errors": { ... } }`.

**React UI**

- `frontend/src/modules/facilities/components/FacilitiesDashboard.jsx` — browse, filter, admin CRUD, booking entry for eligible users.
- `frontend/src/modules/facilities/components/ResourceModal.jsx` — create/edit form with client-side checks and display of API validation messages.

**Automated tests**

- `backend/web-app/src/test/java/com/smartcampus/FacilitiesResourceApiIT.java` — public GET, invalid POST (400), authenticated admin POST (201).

## Member 2 — Booking workflow + conflict checking
**REST API (base path /api/bookings)**

| Method | Path                        | Description                                                                                                  | Access |
| ------ | --------------------------- | ------------------------------------------------------------------------------------------------------------ | ------ |
| `POST` | `/api/bookings`             | Create booking request for a resource (`resourceId`, `startTime`, `endTime`, `purpose`, `expectedAttendees`) | USER   |
| `GET`  | `/api/bookings/my`          | List current user’s bookings                                                                                 | USER   |
| `PUT`  | `/api/bookings/{id}/cancel` | Cancel own booking (sets status to `CANCELLED`)                                                              | USER   |
| `GET`  | `/api/bookings/all`         | List all bookings (optional filter by `status`)                                                              | ADMIN  |
| `PUT`  | `/api/bookings/{id}/status` | Update booking status (`status` required, `reason` optional)                                                 | ADMIN  |

New bookings are created with status PENDING. Business-rule failures (missing resource, overlap, availability window, approval conflict, etc.) return HTTP 400 with the exception message as the response body (plain text from ResponseEntity.badRequest().body(e.getMessage())), not the same { "message", "errors" } JSON shape as facility validation.

**React UI**

frontend/src/modules/bookings/components/BookingsDashboard.jsx — user: my bookings + cancel; admin: queue, filter by status, approve/reject with optional reason; entry points aligned with the API.
frontend/src/modules/bookings/components/BookingModal.jsx — create/edit-style flow for submitting a booking (times, purpose, attendees) against a chosen resource.

**Automated tests**

The repo currently includes backend/web-app/src/test/java/com/smartcampus/FacilitiesResourceApiIT.java for facilities only. There is no dedicated booking integration test under web-app/src/test yet. A natural follow-up for Member 2 would be something like BookingsApiIT.java: e.g. POST without auth (401/403), POST as USER with overlapping slot (400), POST as USER with valid slot (200), PUT .../status as ADMIN for approve with conflict (400), etc.

## GitHub Actions

Workflow should run `mvn clean verify` on push/PR so the backend compiles and tests pass.

## Repository naming (assignment)

Use the course naming pattern, e.g. `it3030-paf-2026-smart-campus-groupXX`, and exclude `node_modules`, `target`, and other build artifacts from submission zips.
