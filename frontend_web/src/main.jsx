import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import ToastProvider from "./context/ToastProvider";
import AuthProvider from "./context/AuthProvider";
import { StoreProvider } from "./context/StoreContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { CartProvider } from "./context/CartContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <ToastProvider>
            <ConfirmProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </ConfirmProvider>
          </ToastProvider>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
