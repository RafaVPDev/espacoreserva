import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Confirm from "./pages/Confirm";
import Success from "./pages/Success";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/confirm" element={<Confirm />} />
      <Route path="/success" element={<Success />} />
    </Routes>
  );
}
