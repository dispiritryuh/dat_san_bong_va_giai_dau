# Football Pitch Booking System

A full-stack web application for booking football pitches, managing teams, and interacting with other players in real time.

## Overview

This project was built as a personal learning project to practice modern full-stack development with Node.js and Next.js. The application allows users to browse football pitches, make bookings, create teams, challenge other teams, and receive real-time notifications.

## Features

* User authentication with JWT
* User registration and login
* Browse and book football pitches
* Manage personal profile
* Create and manage teams
* Challenge other teams to matches
* Real-time notifications and messaging using WebSocket
* Admin management pages
* Redis-based locking mechanism to prevent booking conflicts

## Tech Stack

### Backend

* Node.js
* TypeScript
* Express.js
* Prisma ORM
* PostgreSQL
* Redis
* WebSocket (Socket.IO)
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
│   └── package.json
│
├── frontend
│   ├── app
│   ├── components
│   └── package.json
```

## Getting Started

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database

Start PostgreSQL and Redis using Docker:

```bash
docker-compose up -d
```

Run Prisma migrations:

```bash
npx prisma migrate dev
```

## Learning Objectives

This project was created to gain hands-on experience with:

* Building RESTful APIs with Express.js
* Designing modular backend architecture
* Working with PostgreSQL and Prisma ORM
* Implementing JWT authentication
* Using Redis for caching and distributed locking
* Building real-time features with WebSocket
* Developing a full-stack application with Next.js and TypeScript
* Using Docker for local development environments

## Status

This project is completed as a personal learning project and is no longer under active development.
