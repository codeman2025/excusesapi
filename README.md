# Random Excuse Generator API & Admin Panel

Copyright (c) 2025 Lucas (codeman2025)

All rights reserved.

---

Welcome to the Random Excuse Generator API project — a fun API serving random excuses.

> **Important:** The Admin Panel is for **admin use only** (that means me, Lucas) to add or delete excuses.  
> No access for the public or cloning allowed.

---

### Features

- Public REST API to get random excuses  
- Admin panel to manage excuses (**admin access only**)  
- Secure login with JWT tokens  
- Stylish login and admin pages with themes

---

### API Endpoints

| Method | Endpoint           | Description                 | Request Body                     |
| ------ | ------------------ | ---------------------------| --------------------------------|
| GET    | /api/excuses       | Retrieve all excuses        | None                            |
| GET    | /api/excuses/random| Get a random excuse         | None                            |
| POST   | /api/excuses       | Add a new excuse (admin)    | `{ "excuse": "your excuse" }`  |
| DELETE | /api/excuses/:id   | Delete excuse by ID (admin) | None                            |

---

### Usage

- The public can only access the API endpoints for reading excuses.  
- Only the admin (me, Lucas) can log in to the admin panel and modify excuses.  
- Please do not try to clone, fork, or redistribute this project or run your own server with it.

---

### License & Usage Restrictions

This project’s source code and backend **are NOT open for cloning, modification, or redistribution**.

You may only use the **hosted API and admin panel** as provided by Lucas (codeman2025).

Admin panel access is strictly reserved for the admin (Lucas).

Unauthorized cloning, hosting, or modification is prohibited.

For licensing questions, contact Lucas (codeman2025) on GitHub.

---

### Contributions & Feedback

I’m always happy to hear from you! Reach out with ideas or issues.

Made with 💜 by Lucas (codeman2025)
