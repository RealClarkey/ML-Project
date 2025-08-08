// src/pages/LoginPage.jsx
import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import { Box, Paper, Typography, Button, Stack } from "@mui/material";
import "../App.css"; // reuse your .footer styles from MemberHome

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) navigate("/member");
  }, [auth.isAuthenticated, navigate]);

  if (auth.isLoading) {
    return (
      <Box sx={{ position: "fixed", inset: 0, display: "grid", placeItems: "center" }}>
        <Typography>Checking your session…</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          bgcolor: "background.default",
          p: 2,
          pb: "56px",
          zIndex: 10,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 3,
            borderRadius: 3,
            width: "100%",
            maxWidth: 280,
            mx: "auto",
          }}
        >
          <Stack spacing={2} alignItems="center" textAlign="center">
            {/* Logo */}
            <img
              src="/logo-big.svg"
              alt="Logo"
              style={{ width: "120px", height: "auto" }}
            />

            <Typography variant="h5" fontWeight={800}>
              Welcome back!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please continue below.
            </Typography>

            {auth.error && (
              <Box
                sx={{
                  width: "100%",
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: "error.light",
                  color: "error.contrastText",
                  fontSize: "0.875rem",
                }}
              >
                Error: {auth.error.message}
              </Box>
            )}

            <Button
              variant="contained"
              size="medium"
              fullWidth
              onClick={() => auth.signinRedirect()}
              sx={{ py: 1, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              Login Here!
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              By continuing, you agree to our Terms and Privacy.
            </Typography>
          </Stack>
        </Paper>
      </Box>

      <footer className="footer" style={{ position: "fixed", bottom: 0, width: "100%", zIndex: 20 }}>
        <p>© 2025 Machine Learning DIY. All rights reserved. Built by Leigh Clarke.</p>
      </footer>
    </>
  );
}
