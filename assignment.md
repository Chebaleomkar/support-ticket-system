Here is your document converted to **Markdown (.md)** format.

You can copy this into a file named `Tech_Intern_Assessment.md`.

---

````md
# Support Ticket System  
## Tech Intern Assessment

---

## Overview

Build a **Support Ticket System** from scratch.

Users can:
- Submit support tickets  
- Browse and filter tickets  
- View aggregated metrics  

### The Twist

When a ticket is submitted, an **LLM automatically categorizes it and suggests a priority level** based on the description — the user can then review and override these suggestions.

You will build:

- Backend  
- Frontend  
- LLM integration  
- Docker containerization  

**Time Limit:** 3 hours from when you receive this  

---

## Tech Stack

- **Backend:** Django + Django REST Framework + PostgreSQL  
- **Frontend:** React  
- **LLM Integration:** Any LLM API (OpenAI, Anthropic, Google, etc.) — use your own API key  
- **Infrastructure:** Docker + Docker Compose  

---

# Backend Requirements

## Data Model — Ticket

| Field       | Type          | Constraints |
|------------|--------------|-------------|
| title | CharField | max_length=200, required |
| description | TextField | required — the user's full problem description |
| category | CharField | choices: billing, technical, account, general — auto-suggested by LLM, user can override |
| priority | CharField | choices: low, medium, high, critical — auto-suggested by LLM, user can override |
| status | CharField | choices: open, in_progress, resolved, closed — defaults to open |
| created_at | DateTimeField | Auto-set on creation |

**All constraints must be enforced at the database level.**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|------------|
| POST | `/api/tickets/` | Create a new ticket. Return 201 on success. |
| GET | `/api/tickets/` | List all tickets, newest first. Supports `?category=`, `?priority=`, `?status=`, and `?search=` (searches title + description). All filters can be combined. |
| PATCH | `/api/tickets/<id>/` | Update a ticket (e.g., change status, override category/priority). |
| GET | `/api/tickets/stats/` | Return aggregated statistics (see below). |
| POST | `/api/tickets/classify/` | Send a description, get back LLM-suggested category + priority. |

---

## Stats Endpoint Response Format

```json
{
  "total_tickets": 124,
  "open_tickets": 67,
  "avg_tickets_per_day": 8.3,
  "priority_breakdown": {
    "low": 30,
    "medium": 52,
    "high": 31,
    "critical": 11
  },
  "category_breakdown": {
    "billing": 28,
    "technical": 55,
    "account": 22,
    "general": 19
  }
}
````

⚠️ The stats endpoint must use **database-level aggregation** (`aggregate()` / `annotate()` in Django ORM), not Python loops.
This is a key evaluation criterion.

---

# LLM Integration

This is the **core differentiator** of the assignment.

When a user writes a ticket description, the system should call an LLM to auto-suggest a category and priority before the ticket is submitted.

## How It Should Work

* `/api/tickets/classify/` accepts a JSON body with a `description` field
* It calls an LLM API with the description and a prompt that asks for category and priority
* It returns:

```json
{
  "suggested_category": "...",
  "suggested_priority": "..."
}
```

* The frontend calls this endpoint as the user types (or on blur/submit)
* Category and Priority dropdowns are pre-filled with suggestions
* The user can accept or override before submitting

## Requirements

* Use any LLM API (OpenAI, Anthropic, Google, etc.) — use your own API key
* API key must be configurable via environment variable in `docker-compose.yml`
* Handle failures gracefully — if LLM fails, ticket submission must still work
* Include your prompt in the codebase — it will be reviewed

Your:

* LLM choice
* Prompt design
* Error handling

…are all part of the evaluation.

---

# Frontend Requirements

## 1. Submit a Ticket (Form)

* Title input (required, max 200 characters)
* Description textarea (required)
* Category & Priority dropdowns (pre-filled by LLM, fully editable)
* Submit button that POSTs to `/api/tickets/`
* Show loading state while LLM classify call is in progress
* Clear form on success
* Show new ticket without full page reload

---

## 2. Ticket List

* Display all tickets, newest first

* Each ticket shows:

  * Title
  * Truncated description
  * Category
  * Priority
  * Status
  * Timestamp

* Filter by:

  * Category
  * Priority
  * Status

* Search bar filtering via `?search=`

* Clicking a ticket allows status change (open → in_progress → resolved → closed)

---

## 3. Stats Dashboard

* Fetch data from `/api/tickets/stats/`

* Display:

  * Total tickets
  * Open count
  * Average per day
  * Priority breakdown
  * Category breakdown

* Auto-refresh when a new ticket is submitted

> Styling is secondary — focus on functionality first.

---

# Docker Requirements

Your project must be fully containerized.

A reviewer should be able to run everything with:

```bash
docker-compose up --build
```

## Required Services

* PostgreSQL database
* Django backend (runs migrations automatically on startup)
* React frontend
* Proper service dependencies
* LLM API key passed as environment variable (not hardcoded)

The app must be fully functional after `docker-compose up`
(LLM feature depends on valid API key.)

---

# Evaluation Criteria

| Area            | What We Look For                                            | Weight |
| --------------- | ----------------------------------------------------------- | ------ |
| Does it work?   | docker-compose runs, app works end-to-end                   | 20%    |
| LLM integration | Classify endpoint, prompt quality, graceful errors, good UX | 20%    |
| Data modeling   | Correct field types, DB constraints                         | 10%    |
| API design      | Clean endpoints, proper status codes, filters + search      | 10%    |
| Query logic     | DB-level aggregation (no Python loops)                      | 10%    |
| React structure | Components, state management, API integration               | 10%    |
| Code quality    | Readable, consistent, no debug leftovers                    | 10%    |
| Commit history  | Incremental, meaningful commits                             | 5%     |
| README          | Setup instructions, LLM choice, design decisions            | 5%     |

---

# Submission

Zip your entire project folder (including `.git` directory) and upload via the Google Form before the deadline.

## Your Zip Must Include

* Django backend source code
* React frontend source code
* `docker-compose.yml` and Dockerfile(s)
* `README.md` with:

  * Setup instructions
  * Which LLM you used and why
  * Design decisions
* `.git` folder (commit history will be reviewed)

❌ Do not push your code to a public repository.

---

# Rules

* You may use any documentation or learning resources
* Commit history must reflect your own development process
* Entire app must run with one `docker-compose up --build`
* No extra manual setup steps (except API key)
* Do not hardcode your API key

---

## Good luck 🚀

