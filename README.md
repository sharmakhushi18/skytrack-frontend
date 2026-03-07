# ✈️ Flight Delay Alert System — Frontend

A React-based dashboard for the Flight Delay Alert System, consuming a Spring Boot REST API. Passengers get real-time alerts when flights are delayed or cancelled.

> Built by **Khushi Sharma** | Full Stack Developer | LNCT Bhopal

---

## 🔗 Backend Repository
[flight-delay-alert-api](https://github.com/sharmakhushi18/flight-delay-alert-api) — Spring Boot + MySQL + JPA

---

## 🚀 Features

- View all flights with live status
- Color-coded status badges — ON_TIME, DELAYED, CANCELLED, BOARDING, DEPARTED
- Add new flights
- Update flight status (triggers auto alerts)
- Register passengers
- Book flight seats
- View passenger delay/cancellation alerts

---

## 🛠️ Tech Stack

| Technology | Usage |
|------------|-------|
| React 18 | Frontend framework |
| JavaScript ES6+ | Core language |
| CSS3 | Styling |
| Fetch API | REST API integration |
| Spring Boot | Backend (port 8080) |

---

## 📸 Screenshots

### Flights Dashboard
![Flights](screenshots/flights-tab.png)

### Book Flight
![Book](screenshots/book-tab.png)

### Passenger Alerts
![Alerts](screenshots/alerts-tab.png)

---

## ⚙️ How to Run Locally

### Prerequisites
- Node.js v16+
- Spring Boot backend running on `http://localhost:8080`

### Steps

```bash
# Clone the repository
git clone https://github.com/sharmakhushi18/flight-delay-frontend.git

# Navigate to project
cd flight-delay-frontend

# Install dependencies
npm install

# Start the app
npm start
```

App runs at: `http://localhost:3000`

> Make sure backend is running at `http://localhost:8080` before starting frontend.

---

## 🗂️ Project Structure

```
src/
├── App.js        ← All components (Flights, Book, Alerts)
├── App.css       ← Dark theme styling
└── index.js      ← Entry point
```

---

## 🔄 How It Works

```
User opens browser (localhost:3000)
        ↓
React fetches data from Spring Boot API (localhost:8080)
        ↓
Flights, bookings, alerts displayed in real-time
        ↓
Status update → Backend auto-generates passenger alerts
```

---

## 👩‍💻 Author

**Khushi Sharma**
- GitHub: [@sharmakhushi18](https://github.com/sharmakhushi18)
- Final Year ECE | LNCT Bhopal
