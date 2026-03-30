# Q-SAND (Quantum-Inspired Security Anomaly Detection) - Frontend

This repository contains the interactive Dashboard and Visualization Graphical User Interface (GUI) for the Q-SAND Network Intrusion Detection project. It is built using modern web compilation standards to securely interface with the underlying High-Performance Python AI backend.

## 🚀 Tech Stack
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite (Lightning fast HMR)
- **Styling**: Tailwind CSS v4
- **Charting Engine**: Recharts (Optimized SVG rendering)
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 🛠 Features & Architecture
The frontend is logically separated into four primary operational tabs designed to seamlessly track malicious IoT/IIoT network permutations.

### 1. Dashboard (`/src/pages/Home.tsx`)
Provides a high-level overview of the anomaly detection landscape, live statistics, and system connectivity status to the Uvicorn pipeline.

### 2. Training Engine (`/src/pages/Training.tsx`)
A rigorous configuration wizard that connects the backend to the `Edge-IIoTset` massive network dataset.
- Supports dynamically loading gigabytes of raw local packet dumps.
- Connects to the **Quantum PCA Layer** (Compressing 58 multi-variance dimensions down to 8 hyper-dense qubits).
- Automates **SMOTE Class Balancing** to normalize Attack vs Normal packet ratios.
- Fires standard XGBoost Training iterations natively.

### 3. Live Detection (`/src/pages/Detection.tsx`)
Visualizes the highly complex $O(N)$ linear-time **QTTA (Quantum Tunneling Threshold Adapter)** algorithm. 
- Automatically downsamples charting nodes (up to 240,000 incoming attack packets) to 500 visual breakpoints to prevent browser OOM crashes.
- Seamlessly graphs the "Dynamic Noise Floor" and the exact Threshold collision triggers.

### 4. Explainable AI / XAI (`/src/pages/Explainability.tsx`)
Leverages SHAP (SHapley Additive exPlanations) to crack open the XGBoost black box.
- **Global Feature Importance (Bar Chart)**: Identifies which latent Principal Components (`PC1-PC8`) rule the model.
- **SHAP Value Matrix (Heatmap)**: A dense packet-by-packet cross-sectional analysis isolating exactly *why* a single packet was flagged.
- **Partial Dependence Plots (PDP)**: Analyzes exactly how increasing or decreasing individual PCA variance components shifts the model probability.

## 📥 Setup & Installation

**1. Install Dependencies**
```bash
# Navigate to the frontend directory
cd NIS-fe

# Install all NodeJS packages
npm install
```

**2. Start the Development Server**
```bash
# Launch Vite Server (usually starts on http://localhost:5173)
npm run dev
```

*Note: Ensure the `NIS-be` Python Uvicorn backend is actively running concurrently, otherwise the API calls (`Axios`) will fail to resolve the WebSocket and HTTP endpoints.*
