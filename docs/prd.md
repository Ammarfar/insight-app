# Learning Growth Platform

## 1. Product Vision

Build a personal learning platform that helps users turn information they consume into knowledge they can remember, connect, and continuously grow.

The product should not become a storage place for forgotten notes.

Instead, it should create a continuous learning loop:

**Consume → Capture Insight → Connect → Revisit → Re-absorb → Grow**

The user's learning data should remain portable and owned by the user.

---

# 2. Problem

People consume useful information from:

* Books
* Videos
* Articles
* Podcasts
* Courses
* Conversations
* Work
* Personal experiences

However, much of that knowledge is eventually forgotten.

Traditional note-taking applications mainly solve the storage problem.

Notes are often:

* Written once and never revisited.
* Stored without meaningful relationships to other knowledge.
* Difficult to rediscover later.
* Disconnected from the user's broader learning journey.
* Unable to show whether the user is actually learning or retaining information.

The platform should turn learning moments into interconnected, repeatedly reinforced Insights.

---

# 3. Core Knowledge Unit

## Insight

An Insight represents one meaningful thing the user learned, realized, or wants to remember.

Examples:

> Environment has a strong influence on habit formation.

> Compound interest becomes powerful because growth itself generates additional growth.

> Database indexes improve read performance but introduce additional write cost.

An Insight should ideally represent one clear idea.

One Source may produce multiple Insights.

Example:

**Atomic Habits**

→ Environment influences behavior.
→ Reduce friction for good habits.
→ Identity reinforces habits.
→ Small improvements compound over time.

---

# 4. Core Entities

## User

Represents the owner of the knowledge base.

A User owns:

* Insights
* Sources
* Topics
* Reviews
* Learning progress
* Backup configuration

---

## Insight

The primary knowledge entity.

Attributes:

* Title
* Content
* Source
* Topics
* Related Insights
* Created date
* Updated date

An Insight can:

* Belong to multiple Topics.
* Connect to multiple other Insights.
* Be reviewed multiple times.

---

## Source

Represents where an Insight originated.

Examples:

* Book
* YouTube video
* Article
* Podcast
* Course
* Conversation
* Personal experience

Possible attributes:

* Type
* Title
* Author / creator
* URL
* Additional metadata

One Source can produce many Insights.

---

## Topic

Represents an area of knowledge.

Examples:

* Psychology
* Backend Engineering
* Finance
* Productivity
* Communication
* Personal Growth

An Insight can belong to multiple Topics.

A Topic can contain multiple Insights.

---

## Insight Connection

Represents a relationship between two Insights.

For V1, only one relationship is required:

**Related**

More specific relationship types may be added later.

Example:

**Environment influences behavior**

↔

**Reduce friction for good habits**

---

## Insight Review

Represents each time an Insight is revisited.

Possible attributes:

* Insight
* Review date
* Review result

Initial review result options:

* Remembered
* Needs Review

A review history allows the platform to understand whether knowledge is being revisited instead of simply stored.

---

## XP Event

Represents an activity that contributes to learning progress.

Examples:

* Insight created
* Insight reviewed
* Insight connected
* Daily review completed

XP should be event-based rather than only stored as one mutable total.

Examples:

`CREATE_INSIGHT +5`

`REVIEW_INSIGHT +5`

`CONNECT_INSIGHT +3`

`COMPLETE_DAILY_REVIEW +10`

The user's total XP can be derived or cached from these events.

---

## User Progress

Represents the user's current learning progression.

Possible attributes:

* Current XP
* Level
* Current streak
* Longest streak
* Last active learning date

This data may be cached for faster reading while XP Events remain the historical source of truth.

---

## Backup

Represents application-level backup metadata.

Possible attributes:

* User
* Google Drive file identifier
* Backup version
* Backup type
* Created date
* Status

Backup types:

* Manual
* Automatic

The backup file contains semantic user data, not infrastructure credentials.

---

# 5. Product Principles

## 5.1 Capture Should Be Easy

Adding an Insight should require minimal friction.

The user should be able to quickly record knowledge while:

* Reading.
* Watching something.
* Working.
* Learning.
* Thinking.

The application should not require excessive organization before saving.

**Capture first. Organize later.**

---

## 5.2 Insights Should Not Become Dead Notes

The application must actively resurface previous Insights.

Knowledge should periodically return to the user instead of disappearing into an archive.

---

## 5.3 Connections Matter

New knowledge becomes more useful when it connects with previous knowledge.

The platform should help users recognize:

> I learned something similar before.

or:

> This concept connects with something I learned somewhere else.

---

## 5.4 Progress Should Represent Learning

Gamification should reward meaningful learning behavior.

Progress should not primarily reward note volume.

The platform should reward:

* Capturing meaningful Insights.
* Reviewing Insights.
* Creating knowledge connections.
* Returning consistently.
* Completing learning sessions.

---

## 5.5 Keep the System Lightweight

The user should not become a librarian of their own knowledge.

Organization should support learning instead of becoming another task.

---

## 5.6 Your Knowledge Belongs to You

Users should retain ownership and portability of their learning data.

The platform must support:

* Export.
* Google Drive backup.
* Google Drive restore.

Google Drive is used as a backup and portability layer rather than the primary application database.

---

# 6. Core Learning Loop

## Step 1 — Consume

The user learns something.

↓

## Step 2 — Capture

The user records an Insight.

↓

## Step 3 — Connect

The Insight may be associated with:

* Source
* Topics
* Related Insights

↓

## Step 4 — Revisit

The platform resurfaces previous Insights.

↓

## Step 5 — Re-absorb

The user recalls or rereads the Insight.

↓

## Step 6 — Progress

The platform records the learning activity.

↓

The user becomes motivated to continue learning.

---

# 7. MVP Objective

The MVP should answer:

> Can this product help users remember and reconnect with things they previously learned?

The MVP learning loop is:

**Capture → Connect → Revisit → Progress**

---

# 8. MVP Features

## 8.1 Insight Capture

Users can quickly create an Insight.

Required:

* Insight content

Optional:

* Title
* Source
* Topics

Creating an Insight should ideally take less than 20 seconds.

---

## 8.2 Insight Library

Users can browse their previous Insights.

Capabilities:

* Recent Insights
* Search
* Filter by Topic
* Filter by Source

---

## 8.3 Insight Detail

Displays:

* Insight content
* Source
* Topics
* Related Insights
* Review history
* Last reviewed date

---

## 8.4 Related Insights

Users can manually connect an Insight with another Insight.

For MVP:

**Insight A ↔ Insight B**

Connections are bidirectional from the user's perspective.

---

## 8.5 Daily Review

The platform resurfaces a small number of Insights.

Example:

### Today's Review

5 Insights waiting.

Users can:

* Review
* Skip
* Mark as remembered
* Mark as needing another review

The MVP does not require advanced spaced repetition.

A simple review scheduling mechanism is sufficient.

---

## 8.6 Topics

Users can browse their knowledge by Topic.

Each Topic can display:

* Number of Insights
* Recently learned Insights
* Recently reviewed Insights

Topic-level progression can be added later.

---

## 8.7 Learning Progress

Display:

* Level
* XP
* Learning streak
* Insights reviewed this week
* Insights created this week

Avoid excessive analytics for MVP.

---

# 9. Gamification

V1 should only contain:

## XP

Example rewards:

* Create Insight: +5 XP
* Review Insight: +5 XP
* Connect Insights: +3 XP
* Complete Daily Review: +10 XP

Exact values are configurable and may change.

---

## Level

XP contributes to a global Learning Level.

Example:

Level 1
Level 2
Level 3
...

Optional names such as Explorer or Scholar may be introduced later.

---

## Streak

A learning day counts when a user performs meaningful learning activity.

Examples:

* Creates an Insight.
* Reviews an Insight.
* Completes Daily Review.

The streak system should avoid excessively punishing occasional missed days.

---

# 10. Data Ownership & Backup

## Primary Database

The application uses PostgreSQL as the operational database.

Google Drive is not used as the primary database.

---

## Google Drive Integration

Users can connect their Google account and enable backup.

Google Drive is used for:

* Manual backup.
* Automatic backup.
* Restore.
* Data portability.

---

## Backup Format

Backups use an application-level data format.

Example:

```json
{
  "version": 1,
  "createdAt": "2026-09-21T12:00:00Z",
  "topics": [],
  "sources": [],
  "insights": [],
  "insightConnections": [],
  "reviews": [],
  "xpEvents": [],
  "preferences": {}
}
```

Backup formats are versioned.

Future schema changes can be handled using migration logic.

Example:

`Backup V1 → Migration → Current Schema`

---

## Backup Data

Included:

* Insights
* Sources
* Topics
* Insight connections
* Reviews
* XP history
* Relevant user preferences

Excluded:

* Google OAuth token
* Google refresh token
* Sessions
* Internal logs
* Cache
* Infrastructure credentials

---

## Manual Backup

Users can trigger:

**Backup Now**

The application creates a backup file and uploads it to Google Drive.

---

## Automatic Backup

For V1, automatic backup may run when:

* User data has changed.
* The previous backup is older than a configured threshold.

A complex job infrastructure is not required initially.

---

## Restore

Restore flow:

1. Select backup.
2. Download backup.
3. Validate format.
4. Validate version.
5. Migrate if required.
6. Start database transaction.
7. Replace/import user learning data.
8. Commit.
9. Roll back completely if restoration fails.

---

# 11. Initial Navigation

## Home

Primary purpose:

**What should I learn/review now?**

Contains:

* Today's Review
* Level / XP
* Streak
* Recent Insights

---

## Insights

Knowledge library.

---

## Topics

Browse knowledge areas.

---

## Progress

Learning progression and lightweight statistics.

---

## Settings

Contains:

* Profile
* Google Drive connection
* Backup
* Restore
* Export data

---

# 12. Global Quick Capture

A persistent:

**+ Insight**

action should be accessible throughout the application.

Shortcut example:

`⌘ + K`

Capture should use a modal or lightweight UI rather than requiring navigation to another complex page.

---

# 13. Explicitly Out of Scope for MVP

Do not build yet:

* Graph visualization.
* Automatic AI linking.
* AI-generated Insights.
* Complex spaced repetition.
* Flashcard system.
* Collaboration.
* Social profiles.
* Leaderboards.
* Public knowledge sharing.
* Complex achievements.
* Skill trees.
* Multiple connection types.
* Advanced recommendations.
* Topic XP systems.
* Native mobile application.

---

# 14. Proposed Technology Stack

## Application

Next.js

Use Next.js as both:

* Frontend.
* Server-side application/backend.

A separate backend service is not required for MVP.

---

## Frontend & Design Direction

Styling
- Tailwind CSS

Component System
- shadcn/ui
- Custom domain components built on top of reusable primitives

Icons
- Lucide

Typography
- Geist

Forms & Validation
- React Hook Form
- Zod

Motion
- Motion, used sparingly for meaningful interaction feedback

Design Principles
- Light mode first
- Calm and minimal
- Content-first
- Neutral base palette
- Pastel semantic accents
- Generous whitespace
- Minimal visual noise
- Consistent reusable components
- Avoid unnecessary cards and decorative UI

Responsive Strategy
- Desktop-first
- Fully usable on tablet and mobile

---

## Database

PostgreSQL

---

## ORM

Drizzle ORM

---

## Authentication

Google OAuth.

---

## Backup

Google Drive API.

---

# 15. MVP Success Criteria

The product should regularly create moments such as:

> I forgot I learned this.

> Seeing this Insight again made it useful.

> I didn't realize these two ideas were connected.

> I can clearly see what I've been learning.

The primary success metric should not be:

**Number of Insights created.**

The long-term target should be:

**Knowledge revisited, connected, and retained.**
