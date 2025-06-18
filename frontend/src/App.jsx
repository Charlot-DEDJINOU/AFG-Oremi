import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Flip, ToastContainer } from "react-toastify";
import NotFound from "./views/NotFound"
import ChatBot from "./components/chat";
import Home from "./views/Home";
import Header from "./components/commons/Header";
import Footer from "./components/commons/Footer";
import SmartInsuranceForm from "./views/automobile";
import InsurancePartnerFinder from "./views/localisation";

function App() {
  return (
    <React.StrictMode>
      <Router>
        <Header />
        <Routes>
          <Route path="*" element={<NotFound />} />
          <Route path="/" element={<Home />} />
          <Route path="/automobile" element={<SmartInsuranceForm />} />
          <Route path="/localisation" element={<InsurancePartnerFinder />} />
        </Routes>
        <Footer />
        <ChatBot />
        <ToastContainer autoClose={5000} icon={true} transition={Flip} />
      </Router>
    </React.StrictMode>
  )
}

export default App