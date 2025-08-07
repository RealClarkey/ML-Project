// src/pages/LoginPage.jsx
import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate("/member");
    }
  }, [auth.isAuthenticated, navigate]);

  if (auth.isLoading) return <p>Loading...</p>;
  if (auth.error) return <p>Error: {auth.error.message}</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Login</h1>
      <button onClick={() => auth.signinRedirect()}>Sign in with Cognito</button>
    </div>
  );
};

export default LoginPage;
