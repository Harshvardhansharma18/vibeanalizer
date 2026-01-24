# VibeAnalyzer 🛡️✨




## 🚀 Features

- **Instant Vibe Check**: Drop a contract address, get instant basic info.
- **Deep Analyzer Simulation**: Simulates running 11+ industry-standard tools (Slither, Mythril, Echidna, etc.).
- **Security Score**: 0-100 scoring system based on finding severity.
- **Full Stack**: Node.js/Express backend + React/Vite/Tailwind frontend.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Ethers.js
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **Tools**: Concurrently (dev), Axios

## 📦 Installation & Usage

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/vibeanalyzer.git
   cd vibeanalyzer
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Run Development Server**
   This starts both the backend API and the frontend client.
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`

## 🏗️ Project Structure

- `/server.js` - Express API entry point.
- `/lib` - Core logic for data fetching and analyzer simulation.
- `/client` - React frontend application.

## 🤝 Contributing

PRs are welcome! Keep it clean, keep it based.

## 📄 License

MIT
