# MeetToTalk - Product Requirements Document

## Problem Statement

Students and young professionals often struggle to:
- Find people with similar interests nearby
- Coordinate meetup logistics efficiently
- Discover local events in real time

Existing social platforms focus on online interaction rather than real-world coordination. MeetToTalk solves this by providing a lightweight, location-aware platform designed specifically for real-world meetup coordination.

---

## Unique Value Proposition

Unlike Discord, Meetup.com, or Facebook Groups, MeetToTalk focuses on:
- **Real-time meetup coordination** with instant notifications
- **Temporary live location sharing** that automatically expires after the event
- **Instant local discovery** with geolocation-based meetup feeds
- **AI-powered recommendations** tailored to user interests and proximity
- **Lightweight mobile-first experience** optimized for quick decision-making

---

## Target Audience

### Primary
- University students
- Hackathon participants
- Study groups

### Secondary
- Hobby communities
- Travelers
- Language learners

---

## Features

### MVP Features
- **Create meetup**: Users can create meetups with title, description, tags, location, and time
- **Join meetup**: Browse and join nearby meetups with one tap
- **Live location sharing**: Optional real-time location sharing during events
- **AI recommendations**: Personalized meetup suggestions based on interests and proximity

### Future Features
- Reputation system (ratings and reviews)
- Event payments (ticket sales, splits)
- AI compatibility matching between users
- Smart scheduling (find best time for groups)
- Friend system with direct messaging

---

## AI Features

### Personalized Meetup Recommendations
- Based on:
  - User interests and tags
  - Meetup category alignment
  - Location proximity (configurable radius)
  - Participation history
  - Trending events

### AI Chatbot (Gemini API)
- Discover nearby meetups through conversation
- Answer event-related questions
- Recommend activities based on user preferences
- Provide event logistics assistance

---

## Privacy & Safety

- **Optional location sharing**: Live location is completely optional
- **Automatic expiration**: Location sharing automatically expires after meetup ends
- **Privacy controls**: Users can block/report problematic participants
- **Anonymity option**: Exact locations hidden until meetup approval by organizer
- **Data retention**: Location data deleted immediately after meetup
- **User verification**: Basic profile verification to reduce spam

---

## User Flow

```
User signs in
    ↓
Select interests & location preferences
    ↓
View AI-recommended meetups
    ↓
Browse nearby meetups
    ↓
Join meetup
    ↓
Optionally enable live location sharing
    ↓
Attend event
    ↓
Rate & review
```

---

## Data Model

### Meetup Object
```json
{
  "id": "meetup_001",
  "title": "AI Study Group",
  "description": "Collaborative ML study session",
  "tags": ["AI", "Machine Learning"],
  "creatorId": "user_123",
  "place": {
    "name": "Rangsit University",
    "lat": 13.965,
    "lng": 100.585,
    "address": "111 Moo 4, Rangsit, Pathum Thani"
  },
  "time": {
    "start": "2026-05-15T19:00:00Z",
    "end": "2026-05-15T21:00:00Z"
  },
  "maxParticipants": 10,
  "participants": ["user_123", "user_456", "user_789"],
  "participantCount": 3,
  "locationSharingEnabled": true,
  "status": "active",
  "createdAt": "2026-05-12T10:30:00Z",
  "imageUrl": "https://example.com/image.jpg"
}
```

### User Object
```json
{
  "id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "interests": ["AI", "Machine Learning", "Web Dev"],
  "location": {
    "lat": 13.964,
    "lng": 100.584
  },
  "radius": 5,
  "profileImage": "https://example.com/profile.jpg",
  "createdAt": "2026-01-01T00:00:00Z",
  "joinedMeetups": 5,
  "createdMeetups": 2,
  "rating": 4.8
}
```

---

## Architecture Overview

```
┌─────────────────────────────┐
│   Frontend (React + Tailwind)│
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Firebase Authentication     │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│   Firestore Database        │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ Realtime Location Updates   │
└──────────────┬──────────────┘
               ↓
┌──────────────────────────────────────────┐
│         External APIs                    │
├──────────────────────────────────────────┤
│ • Google Maps API (geolocation)          │
│ • Gemini AI (recommendations & chatbot)  │
│ • Firebase Cloud Messaging (notifications)
└──────────────────────────────────────────┘
```


## Success Criteria

- ✅ Users can create and join meetups within 5 seconds
- ✅ Recommendations load within 2 seconds
- ✅ Real-time location updates with <1 second latency
- ✅ AI chatbot responds within 3 seconds
- ✅ 100+ test users sign up
- ✅ 50+ meetups created
- ✅ 80%+ user satisfaction rating
