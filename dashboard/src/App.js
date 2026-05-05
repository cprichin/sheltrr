import { useState } from "react";
import ActiveWalks from "./components/ActiveWalks";
import WalkHistory from "./components/WalkHistory";
import ManageDogs from "./components/ManageDogs";
import ManageVolunteers from "./components/ManageVolunteers";
import DogStatus from "./components/DogStatus";
import DailySummary from "./components/DailySummary";
import ManageLocations from "./components/ManageLocations";
import ManageCages from "./components/ManageCages";
import "./App.css";

const TABS = ["Status Board", "Active Walks", "History", "Dogs", "Cages", "Volunteers", "Locations", "Summary"];

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
	{tab === "Locations" && <ManageLocations />}
        {tab === "Cages" && <ManageCages />}
        {tab === "Summary" && <DailySummary />}
      </main>
    </div>
  );
}