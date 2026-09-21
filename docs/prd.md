# Learning Growth Platform

## 1. Product Vision

Build a personal learning platform that helps users turn information they consume into knowledge they can remember, connect, and continuously grow.

The product should not become a storage place for forgotten notes.

Instead, it should create a continuous learning loop:

**Consume → Capture Insight → Connect → Revisit → Re-absorb → Grow**

---

# 2. Problem

People consume a large amount of useful information from:

* Books
* Videos
* Articles
* Podcasts
* Courses
* Conversations
* Personal experiences

However, most of that knowledge is eventually forgotten.

Traditional note-taking applications solve the **storage problem**, but not necessarily the **retention problem**.

Notes are often:

* Written once and never revisited.
* Stored without meaningful relationships to other knowledge.
* Difficult to rediscover later.
* Disconnected from the user's broader learning journey.
* Unable to show whether the user is actually growing.

The product should solve this by turning individual learning moments into **interconnected and repeatedly reinforced insights**.

---

# 3. Core Knowledge Unit

The primary unit of knowledge is an:

## Insight

An Insight represents one meaningful thing the user learned, realized, or wants to remember.

Examples:

> Environment has a strong influence on habit formation.

> Compound interest becomes powerful because growth itself generates additional growth.

> Database indexes improve read performance but introduce additional write cost.

An Insight should ideally represent **one clear idea**.

A single source may produce multiple Insights.

Example:

**Source**

Atomic Habits

↓

**Insights**

* Environment influences behavior.
* Reduce friction for good habits.
* Identity reinforces habits.
* Small improvements compound over time.

---

# 4. Core Entities

For the first version, keep the knowledge model intentionally small.

## Insight

The main learning object.

Possible attributes:

* Title
* Content
* Source
* Topics
* Related Insights
* Created date
* Last reviewed date
* Review count

---

## Source

Where the Insight came from.

Examples:

* Book
* YouTube video
* Article
* Podcast
* Course
* Personal experience

Example:

**Atomic Habits — James Clear**

can produce multiple Insights.

---

## Topic

A broad subject used to organize Insights.

Examples:

* Psychology
* Investing
* Backend Engineering
* Productivity
* Communication
* Personal Finance

An Insight can belong to multiple Topics.

Example:

**"Environment influences behavior."**

Topics:

`Psychology`

`Habit Formation`

`Personal Development`

---

## Insight Connection

A relationship between two Insights.

For V1, the relationship does not need complicated semantic types.

It can simply mean:

**Related to**

Example:

`Environment influences behavior`

↔

`Reduce friction for good habits`

More advanced relationship types can come later.

---

# 5. Core Product Principles

## 5.1 Capture Should Be Easy

Writing an Insight should require minimal friction.

The user should be able to record an Insight quickly while:

* Reading a book.
* Watching a video.
* Learning something at work.
* Having a random realization.

The system should not require excessive metadata before saving.

Capture first.

Organize later if necessary.

---

## 5.2 Insights Should Not Become Dead Notes

The system should actively bring old Insights back to the user.

Knowledge should periodically resurface instead of disappearing into an archive.

---

## 5.3 Connections Matter

Learning becomes more valuable when new knowledge connects with previous knowledge.

The system should make it easy to discover:

> "I learned something similar before."

or:

> "This concept connects with something from another topic."

---

## 5.4 Progress Should Represent Learning

Gamification should reward meaningful learning behavior rather than meaningless activity.

Avoid rewarding users simply for producing large quantities of notes.

Progress should primarily come from actions such as:

* Capturing meaningful Insights.
* Reviewing existing Insights.
* Recalling knowledge.
* Creating useful connections.
* Returning consistently to learning.

---

## 5.5 Keep the System Lightweight

The product should not require users to become librarians of their own knowledge.

Organization should support learning, not become another task.

---

# 6. Core Learning Loop

The primary user loop should be:

## Step 1 — Consume

The user learns something from a source.

↓

## Step 2 — Capture

The user records one or more Insights.

↓

## Step 3 — Connect

The user associates the Insight with:

* Topics
* Existing Insights

↓

## Step 4 — Revisit

The system periodically resurfaces existing Insights.

↓

## Step 5 — Re-absorb

The user reads, recalls, or reflects on the Insight again.

↓

## Step 6 — Progress

The system records learning activity and shows visible progress.

↓

The user becomes motivated to learn again.

---

# 7. MVP Objective

The MVP should answer one question:

> Can this product help the user remember and reconnect with things they have previously learned?

The MVP does not need to solve every knowledge-management problem.

It only needs to successfully support:

**Capture → Connect → Revisit → Progress**

---

# 8. MVP Features

## Insight Capture

User can quickly create an Insight.

Basic fields:

* Insight
* Source
* Topic

Optional:

* Additional note/context

---

## Insight Library

User can browse previously created Insights.

Basic capabilities:

* Recent Insights
* Search
* Filter by Topic
* Filter by Source

---

## Related Insights

Users can manually connect Insights.

When viewing an Insight:

**Related Insights**

* Insight A
* Insight B
* Insight C

---

## Daily Review

The system periodically resurfaces existing Insights.

Example:

### Today's Review

5 Insights to revisit.

The user can:

* Review the Insight.
* Skip it.
* Mark it as remembered.

The first version does not need a complicated spaced-repetition algorithm.

A simple resurfacing mechanism is enough.

---

## Learning Progress

A lightweight progress system.

For example:

**Level 4**

`420 XP`

This week:

* 8 Insights captured
* 12 Insights reviewed
* 3 Connections created

---

# 9. Simple Gamification

For V1, limit gamification to three concepts.

## XP

Represents learning activity.

Example:

Capture Insight
`+5 XP`

Review Insight
`+5 XP`

Connect Insights
`+3 XP`

Complete Daily Review
`+10 XP`

Exact values can be tuned later.

---

## Level

XP contributes to the user's overall Learning Level.

Example:

Level 1 → Explorer

Level 2 → Learner

Level 3 → Thinker

Level 4 → Scholar

The names are optional.

The important part is making long-term progress visible.

---

## Streak

Track days where meaningful learning activity occurred.

But streaks should not punish users aggressively.

Missing one day should not make months of progress feel wasted.

---

# 10. Initial Navigation

Keep the first navigation small.

### Home

Shows:

* Current level / XP
* Daily Review
* Recent Insights
* Learning activity

### Insights

Knowledge library.

### Topics

Browse Insights grouped by Topic.

### Progress

Shows:

* Level
* XP
* Learning activity
* Review statistics

---

# 11. Explicitly Out of Scope for MVP

Do not build yet:

* Complex knowledge graph visualization.
* AI-generated Insights.
* AI automatic linking.
* Advanced spaced repetition.
* Flashcard system.
* Collaborative notes.
* Social features.
* Leaderboards.
* Public profiles.
* Complex achievements.
* Skill trees.
* Multiple relationship types.
* Sophisticated recommendation engines.

These features can be considered later after the core learning loop proves useful.

---

# 12. MVP Success Criteria

The product is successful if the user consistently experiences moments such as:

> "Oh, I remember learning this."

> "I forgot about this Insight, but seeing it again made it useful."

> "I didn't realize these two things were connected."

> "I can actually see what I've been learning lately."

The primary success metric should not be:

**Number of Insights created.**

Instead, the product should eventually optimize for:

**Knowledge revisited and retained.**
