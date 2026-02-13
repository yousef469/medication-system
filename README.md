# MedicationSystem

A comprehensive medication management system featuring 3D anatomy visualization and hospital administration.

## Project Structure

- `src/`: Core application source code (React + Vite).
- `public/`: Static assets including 3D models (GLB) and images.
- `sql/`: Database migration scripts and schema definitions.
- `scripts/`: Internal utility scripts for testing and diagnostics.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production
To create a production build:
```bash
npm run build
```
The output will be in the `dist/` directory.

## Features
- **3D Anatomy Interaction**: Exploded view and interaction with skeletal models.
- **Medication Tracking**: System for managing and tracking medications.
- **Hospital Administration**: Tools for managing hospital staff and visibility.
- **PWA Support**: Offline-capable web application.
