# Football Pitch Booking

A full-stack web application for booking football pitches, managing teams, and coordinating football matches. The platform provides real-time interactions, notifications, and administrative tools to simplify football pitch management and player engagement.

## Features

### Authentication & Authorization

* User registration and login
* JWT-based authentication
* Protected routes and role-based access control

### Pitch Booking

* Browse available football pitches
* View pitch information and schedules
* Create and manage bookings
* Prevent booking conflicts with Redis locking

### Team Management

* Create and manage teams
* View team information and members
* Coordinate matches between teams

### Match Challenges

* Send and receive match challenges
* Manage challenge requests and responses
* Track scheduled matches

### Real-Time Features

* Real-time notifications
* Real-time messaging and updates
* WebSocket-based communication

### Administration

* Manage pitches and system resources
* Monitor users and platform activities
* Administrative dashboard

## Tech Stack

### Backend

* Node.js
* TypeScript
* Express.js
* Prisma ORM
* PostgreSQL
* Redis
* Socket.IO
* Docker

### Frontend

* Next.js
* React
* TypeScript
* Axios

## Project Structure

```text
.
├── backend
│   ├── prisma
│   ├── server
│   │   ├── modules
│   │   ├── real
│   │   ├── share
│   │   └── model
│   └── package.json
│
├── frontend
│   ├── app
│   ├── components
│   ├── lib
│   ├── service
│   └── package.json
│
└── README.md
```

## Architecture Overview

### Backend

The backend follows a modular architecture. Business domains are organized into independent modules, while shared services handle authentication, database access, notifications, and real-time communication.

### Database

PostgreSQL is used as the primary database, with Prisma ORM handling schema management and database access.

### Caching & Concurrency

Redis is used for caching and distributed locking to avoid booking conflicts and improve system responsiveness.

### Real-Time Communication

WebSocket communication enables instant notifications and interactive features such as messaging and challenge updates.

## Getting Started

### Prerequisites

* Node.js 20+
* Docker and Docker Compose
* PostgreSQL
* Redis

### Clone Repository

```bash
git clone https://github.com/dispiritryuh/football-pitch-booking.git
cd football-pitch-booking
```

### Start Infrastructure

```bash
docker-compose up -d
```

### Backend Setup

```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Future Improvements

* Payment integration
* Advanced search and filtering
* Email notifications
* Mobile-friendly enhancements
* Analytics and reporting dashboard

## License

This project is available for educational and portfolio purposes.
