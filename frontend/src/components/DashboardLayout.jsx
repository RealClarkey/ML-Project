// src/components/DashboardLayout.jsx
import React from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, IconButton, Avatar } from '@mui/material';
import { useAuth } from "react-oidc-context";
import MenuIcon from '@mui/icons-material/Menu';

const drawerWidth = 240;
const COGNITO_DOMAIN = "https://eu-north-1vx4lzvaon.auth.eu-north-1.amazoncognito.com";
const CLIENT_ID = "5al6bqqs0k4pmcm35d3d7vjt02";
const LOGOUT_REDIRECT = "http://localhost:5173";

const DashboardLayout = ({ children }) => {
    const auth = useAuth();
    const handleLogout = async () => {
        // 1) Clear local tokens (so app thinks you're logged out)
        await auth.removeUser();
        // 2) Hit Cognito Hosted UI logout
        window.location.href =
      `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(LOGOUT_REDIRECT)}`;
    };
    return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', padding: 2 }}>

          <Typography variant="h6">Menu</Typography>
          {/* You can replace with <List> items */}
          <Typography variant="body1" sx={{ mt: 2 }}>Upload</Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>Preprocess</Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>Results</Typography>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        {/* Top Bar */}
        <AppBar
          position="fixed"
          sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
        >
          <Toolbar sx={{ justifyContent: 'flex-end' }}>

            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}></Typography>
            <IconButton color="inherit" onClick={(handleLogout)}>
              <Avatar alt="User" />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Push content below top bar */}
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
