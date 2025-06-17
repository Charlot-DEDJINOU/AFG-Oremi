import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Flip, ToastContainer } from "react-toastify";
import NotFound from "./views/NotFound"
import ChatBot from "./components/chat";
import Home from "./views/Home";
import Header from "./components/commons/Header";
import Footer from "./components/commons/Footer";

function App() {
  return (
    <React.StrictMode>
      <Router>
        <Header />
        <Routes>
          <Route path="*" element={<NotFound />} />
          <Route path="/" element={<Home />} />
        </Routes>
        <Footer />
        <ChatBot />
        <ToastContainer autoClose={5000} icon={true} transition={Flip} />
      </Router>
    </React.StrictMode>
  )
}

export default App