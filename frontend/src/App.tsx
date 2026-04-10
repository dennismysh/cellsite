import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="p-8 bg-surface text-text min-h-screen">
            <h1 className="text-accent text-2xl font-semibold">
              セルサイト — theme test
            </h1>
          </div>
        }
      />
    </Routes>
  );
}
