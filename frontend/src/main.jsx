// src/main.jsx
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "react-oidc-context";
import "@/index.css"

const cognitoAuthConfig = {
  authority: "https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_VX4lzVaon", // your Cognito domain
  client_id: "5al6bqqs0k4pmcm35d3d7vjt02", // from your Cognito app client
  redirect_uri: "http://localhost:5173",   // must match Cognito callback URL
  response_type: "code",
  scope: "phone openid email",           // ask for what you need
  post_logout_redirect_uri: "http://localhost:5173"
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </StrictMode>
);
