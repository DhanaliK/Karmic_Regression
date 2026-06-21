# Karmic Regression: Behavioral Analysis & LLM Reflection Engine

A highly advanced, full-stack psychological profiling platform that blends Machine Learning (XGBoost/GMM clustering) with Large Language Models (Groq) to provide deep, emotionally intelligent "Karmic Reflections."

This project was built to analyze user behavioral tendencies, map them against demographic/symbolic priors (like age, gender, and numerology), and generate a personalized, dynamic psychological evaluation.

## 🚀 Features

- **Machine Learning Clustering**: Utilizes a trained Gaussian Mixture Model (GMM) and XGBoost pipeline to calculate "Psychological Entropy" and classify users into 6 distinct Karmic Archetypes (e.g., Fire Karma, Shadow Karma).
- **LLM Narrative Generation**: Integrates with the Groq API (Llama 3) to synthesize ML probabilities into a deeply relatable, Gen-Z styled psychological reading.
- **Graceful API Fallbacks & Asynchronous Jobs**: Features a background `APScheduler` that handles heavy LLM API rate limits. If the system is overloaded, user predictions are safely queued as `PendingPredictions` and processed asynchronously in the background.
- **Secure Authentication & OTPs**: Complete, secure user registration and password recovery flows powered by email-based One-Time Passwords (OTPs) and JWT tokens.
- **Automated Re-engagement Loop**: A 30-day adaptive cycle that automatically emails users dynamically generated questions to track their behavioral evolution over time.
- **Cinematic React UI**: A stunning, high-performance frontend built with Vite, React, TailwindCSS, and Framer Motion, featuring dynamic 3D orb clusters and glassmorphism.

## 🛠️ Technology Stack

**Frontend:**
- React (Vite)
- TailwindCSS
- Framer Motion
- Chart.js (Radar Charts)

**Backend:**
- FastAPI (Python)
- SQLAlchemy (SQLite)
- APScheduler (Background Tasks)
- Groq LLM API (Llama 3)
- Scikit-Learn & XGBoost (Machine Learning)

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js v18+
- A [Groq API Key](https://console.groq.com/)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
```

Rename `.env.template` to `.env` in the root folder and add your `GROQ_API_KEY` and SMTP credentials.

Start the FastAPI Server:
```bash
python app.py
```
The backend will run on `http://127.0.0.1:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

## 🧠 System Architecture

1. **Stage 1 (Prior Calculation)**: Derives a baseline psychological blueprint based purely on demographic and symbolic priors.
2. **Stage 2 (Micro-Questionnaire)**: A 9-question behavioral survey mapped to psychological heuristic features (Impulsivity, Ego, Self-Awareness).
3. **Stage 3 (ML Inference)**: The vector is passed through the saved GMM models to calculate Archetypal Probabilities and Entropy.
4. **Stage 4 (LLM Synthesis)**: The resulting probabilities and user answers are fed to Llama 3 via Groq to construct a highly personalized reading.

## 📝 License

This project was developed as an academic submission for behavioral computing and machine learning architecture. All rights reserved.
