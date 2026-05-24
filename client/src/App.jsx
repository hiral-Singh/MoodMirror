import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import Entries from "./pages/Entries";
import EntryDetails from "./pages/EntryDetails";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MoodTracker from "./pages/MoodTracker";
import Profile from "./pages/Profile";
import Register from "./pages/Register";

const App = () => (
  <Routes>
    <Route element={<MainLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/track" element={<MoodTracker />} />
        <Route path="/entries" element={<Entries />} />
        <Route path="/entries/:id" element={<EntryDetails />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Route>
  </Routes>
);

export default App;
