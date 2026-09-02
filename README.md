# SafeSense AI — Safety Intelligence Platform

> **"Turning Safety Reports into Preventive Action"**

An AI-powered industrial safety intelligence platform that analyzes written safety reports to identify serious-risk precursors, classify risk, detect recurring patterns, map safety rules, and drive preventive action.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Python 3.10+ *(for backend, optional)*

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

**Demo login:** `admin@safesense.ai` / `admin123`

---

## 📁 Project Structure

```
safesense-ai/
├── frontend/                  # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── pages/             # All page components
│   │   ├── components/        # Shared UI components
│   │   ├── context/           # Global state (AppContext)
│   │   ├── data/              # Synthetic demo data generator
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Risk engine, dataset utilities
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── backend/                   # Python FastAPI
    ├── main.py                # API entry point
    ├── services/
    │   ├── risk_engine.py     # NLP + rule-based analysis
    │   ├── auth.py            # JWT authentication
    │   └── report_generator.py
    └── requirements.txt
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **AI Report Analysis** | Analyzes safety report text using NLP rule-based engine |
| **SIF Precursor Detection** | Identifies Serious Injury or Fatality potential |
| **Risk Scoring** | Transparent 0–100 risk score with factor breakdown |
| **Explainable AI** | Shows exactly which phrases triggered the risk flag |
| **Life-Saving Rule Mapping** | Maps reports to relevant safety rules |
| **Barrier Failure Detection** | Identifies failed safety controls |
| **Pattern Discovery** | Finds recurring failure patterns across the dataset |
| **Early Warning Center** | Detects rising trends and precursor concentrations |
| **Safety Copilot** | AI assistant that answers questions about your data |
| **What-If Simulator** | Simulates risk reduction after applying controls |
| **HSE Review Workflow** | Human-in-the-loop confirm/correct/reject |
| **Dataset Upload** | CSV and Excel upload with auto column detection |
| **Demo Dataset** | 250+ synthetic industrial safety reports built-in |
| **Action Center** | Track corrective actions with status and due dates |
| **Executive Dashboard** | KPI cards, charts, site ranking, activity ranking |
| **Command Center** | Real-time critical alerts and risk overview |

---

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@safesense.ai | admin123 |
| HSE Officer | hse@safesense.ai | hse123 |
| Safety Manager | manager@safesense.ai | mgr123 |
| Site Manager | site@safesense.ai | site123 |

---

## 🧠 Tech Stack

**Frontend**
- React 18 + TypeScript
- Tailwind CSS
- Recharts (charts)
- Lucide React (icons)
- React Router v6
- PapaParse (CSV parsing)
- SheetJS/xlsx (Excel parsing)
- Framer Motion (animations)

**Backend**
- Python + FastAPI
- Pandas + NumPy
- scikit-learn
- JWT Authentication

---

## 📊 Dataset Upload

The platform accepts:
- **CSV files** — any delimiter, auto-detected columns
- **Excel files** (.xlsx, .xls)

Supported columns (auto-detected):
`report_text`, `report_type`, `severity`, `sif_potential`, `site`, `location`, `activity`, `date`, `barrier_failure`, `life_saving_rule`, `recommended_action`

---

## ⚠️ Important Notices

- Risk scores are **prototype calculations** — not certified safety metrics
- SIF potential indicates elevated risk precursors — it does **not** predict that a fatality will occur
- All final safety decisions must be made by **authorized, qualified HSE personnel**
- Demo data is **synthetic** — it does not represent real organizational incidents
- Uploaded data is processed in-browser and not transmitted to external services

---

## 🐳 Docker (Optional)

```bash
docker-compose up --build
```

---

## 🏃 Backend Setup (Optional)

```bash
cd backend
pip install -r requirements.txt
python main.py
```

API runs at **http://localhost:8000**  
Swagger docs at **http://localhost:8000/api/docs**

---

## 📄 License

MIT License — for demonstration and educational purposes.

---

*SafeSense AI — Enterprise Safety Intelligence Platform*  
*AI supports HSE decision-making. Final decisions remain with authorized safety personnel.*
