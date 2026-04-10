import { Routes, Route } from "react-router-dom";
import { SpreadsheetPage } from "./spreadsheet/SpreadsheetPage.js";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SpreadsheetPage />} />
    </Routes>
  );
}
