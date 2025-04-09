import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize MathJax for LaTeX rendering
const loadMathJax = () => {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
  script.id = "MathJax-script";
  script.async = true;
  document.head.appendChild(script);
};

// Load MathJax
loadMathJax();

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
