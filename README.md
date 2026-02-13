# MedicationSystem (MediHealth Global)

**Built: January 2025**

MedicationSystem is a next-generation clinical coordination platform designed to unify the workflows of **Patients, Coordinators, Nurses, Doctors, and Hospital Administrators**. By leveraging **Gemini AI** and high-fidelity **3D Bio-Anatomy**, the system provides a seamless experience from initial symptom reporting to pharmacy dispensing.

---

## 🧬 Core Feature: Gemini-Powered 3D Anatomy

The standout feature of this repository is the **3D Bio-Anatomy Lab**. 
- **AI Analysis**: When a patient uploads a medical report or submits a request, **Gemini AI** (1.5 Flash/Pro) analyzes the documentation in real-time.
- **Mesh Mapping**: The AI extracts clinical findings and maps them to specific anatomical mesh names (e.g., `LegL: Femur`, `Vertebrae: L3`).
- **Visual Feedback**: These locations are highlighted on a 3D skeletal/muscular model, allowing doctors and nurses to visualize the pathology immediately within the Patient Dashboard or Doctor Workstation.

---

## 👥 Stakeholder Workflows

- **User (Patient)**: Submit medical requests via text, image, or voice. View personal AI diagnostics and 3D anatomy. Manage secure digital prescriptions.
- **Coordinator (Secretary)**: Unified Triage Hub to route incoming patient requests to the correct specialists based on AI urgency scores.
- **Nurse**: Station centered on care visualizers and vital tracking. Execute clinical instructions and manage medication administration.
- **Doctor**: High-precision workstation with deep clinical synthesis, 3D anatomical reviews, and secure digital prescription generation.
- **Hospital Admin**: Manage clinical staff, verify professional licenses via AI OCR, and monitor hospital-wide clinical performance.

---

## 🛠 Tech Stack & Integration

- **Frontend**: React + Vite, deployed on **Vercel**.
- **Backend Logic**: FastAPI (Python) serving as a proxy for Gemini AI and handling real-time voice/image processing.
- **Database**: **Supabase** (PostgreSQL) with Row Level Security (RLS) and Realtime subscriptions.
- **AI Engine**: Google Gemini (Multimodal) for chat, OCR, and anatomical mapping.

---

## 🚀 Setup & Installation

### 1. Database (Supabase) Setup
1. Create a new Supabase project.
2. Execute the SQL migration scripts located in the `sql/` directory in numerical order to set up schemas, tables, and RLS policies.
3. Configure **Storage Buckets**: Create a public bucket named `medical-records` for patient uploads.

### 2. Backend (AI Logic Server)
The backend acts as a bridge between the frontend and Gemini AI.
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure environment variables in `.env` (see below).
3. Start the FastAPI server:
   ```bash
   python server.py
   ```
4. **LocalTunnel (Optional)**: If deploying the frontend to Vercel/APK, you must expose your local backend:
   ```bash
   lt --port 8001 --subdomain medical-hub-brain
   ```

### 3. Frontend (React)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development mode:
   ```bash
   npm run dev
   ```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Gemini AI Configuration
GEMINI_API_KEY=your_google_gemini_api_key

# Backend (Internal)
PORT=8001
```

---

## 📡 Deployment

- **Frontend**: Connect your GitHub repository to **Vercel**. Ensure the Environment Variables are mirrored in the Vercel Dashboard.
- **Backend**: Can be hosted on any provider supporting Python (DigitalOcean, Heroku) or kept local with a tunnel for prototyping.

---
*Built for the future of global healthcare.*
