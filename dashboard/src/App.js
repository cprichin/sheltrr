import { useState } from "react";
import ActiveWalks from "./components/ActiveWalks";
import WalkHistory from "./components/WalkHistory";
import ManageDogs from "./components/ManageDogs";
import ManageVolunteers from "./components/ManageVolunteers";
import DogStatus from "./components/DogStatus";
import DailySummary from "./components/DailySummary";
import "./App.css";

const TABS = ["Status Board", "Active Walks", "History", "Dogs", "Volunteers", "Summary"];

export default function App() {
  const [tab, setTab] = useState("Status Board");

  return (
    <div className="app">
      <header className="header">
        <span className="header-logo">🐾</span>
        <h1>Sheltrr</h1>
        <span className="header-sub">Shelter Walk Tracker</span>
      </header>

      <nav className="nav">
        {TABS.map(t => (
          <button
            key={t}
            className={`nav-btn ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === "Status Board" && <DogStatus />}
        {tab === "Active Walks" && <ActiveWalks />}
        {tab === "History" && <WalkHistory />}
        {tab === "Dogs" && <ManageDogs />}
        {tab === "Volunteers" && <ManageVolunteers />}
        {tab === "Summary" && <DailySummary />}
      </main>
    </div>
  );
}