# Finance with Omkar v2 🧞

A full-stack financial planning app with live market data, FIRE calculator, liabilities planner, currency converter, and Aladdin + Genie branding.

## What's New in v2
- **Silver asset class** — add multiple silver holdings (physical, ETF, e-Silver)
- **Multiple items per asset/liability type** — add unlimited items for each category
- **Currency converter** — 💱 button on every money value to convert between 14+ currencies
- **Backend market data** — yfinance integration (free, unlimited, no API key)
- **Profile management** — display name, preferred currency
- **Financial analysis** — risk scoring, diversification, recommendations
- **Improved security** — salted password hashing, environment-based secrets

## Quick Start

### Requirements
- Python 3.x
- Flask (`pip install flask`)
- yfinance (`pip install yfinance`) — optional, falls back to static data

### Run
```bash
cd backend
pip install -r requirements.txt
python3 app.py
```
Then open: http://localhost:5000

### Account Rules
- Username: exactly 10 characters (letters/numbers/underscore)
- Password: 4–10 chars, needs letter + number + symbol (e.g. Fire@2024)

## Project Structure
```
finance-omkar-v2/
├── backend/
│   ├── app.py           ← Flask server (all API routes)
│   ├── config.py        ← Configuration & constants
│   ├── requirements.txt
│   └── data/            ← JSON storage (auto-created)
└── frontend/
    └── public/
        ├── index.html   ← Main SPA
        ├── css/style.css
        └── js/
            ├── api.js, auth.js, app.js
            ├── markets.js, news.js
            ├── sip.js, portfolio.js
            ├── fire.js, liabilities.js
            └── mascot.js
```

## Features
- 🔥 FIRE Calculator with 9 asset classes (bank, stocks, FD, ETFs, gold, **silver**, property, bonds/PPF/NPS)
- 📊 Live global market data (India, US, Global, Crypto, Commodities)
- 💱 Currency converter on every money page
- 📰 Live financial news (India, Global, Crypto via RSS)
- 💸 SIP Calculator with interactive charts
- 📋 Liabilities planner (car, house, bike, wedding, children, education, travel, gadgets, other)
- 🎯 Financial analysis with risk scoring
- 👤 User profiles with preferred currency
- 🧞 Aladdin & Genie mascot with finance tips
