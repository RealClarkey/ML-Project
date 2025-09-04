// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MemberHome from "./pages/MemberHome";
import ProtectedRoute from "./components/ProtectedRoute";
import Analyse from "./pages/Analyse";
import Preprocessing from "./pages/Preprocessing";


const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/member"
        element={
          <ProtectedRoute>
            <MemberHome />
          </ProtectedRoute>
        }
      />
        <Route path="/analyse" element={<ProtectedRoute><Analyse /></ProtectedRoute>}
      />
        <Route path="/preprocessing" element={<ProtectedRoute><Preprocessing /></ProtectedRoute>}
      />
      <Route path="*" element={<p>404 Page Not Found</p>} />
    </Routes>
  </Router>
);

export default App;
