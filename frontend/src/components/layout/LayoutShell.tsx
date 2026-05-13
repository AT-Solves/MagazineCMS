import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Avatar, Divider, Chip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PublishIcon from '@mui/icons-material/Publish';
import BarChartIcon from '@mui/icons-material/BarChart';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuthStore } from '../../stores/auth.store';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'Content Library', icon: <ArticleIcon />, path: '/content' },
  { label: 'Workflow Board', icon: <AccountTreeIcon />, path: '/workflow' },
  { label: 'Publishing', icon: <PublishIcon />, path: '/publishing' },
  { label: 'Analytics', icon: <BarChartIcon />, path: '/analytics' },
  { label: 'Media Manager', icon: <PhotoLibraryIcon />, path: '/media' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const LayoutShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1 }}>
        <ArticleIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" fontWeight={700} color="primary.dark" noWrap>
          MagazineCMS
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, px: 1 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => { navigate(item.path); setMobileOpen(false); }}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {user.fullName?.[0] ?? user.email[0].toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{user.fullName ?? user.email}</Typography>
              <Chip label={user.role} size="small" color="primary" variant="outlined" sx={{ height: 16, fontSize: 10 }} />
            </Box>
          </Box>
        )}
        <ListItemButton onClick={logout} sx={{ borderRadius: 2, color: 'error.main' }}>
          <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { sm: `${DRAWER_WIDTH}px` }, bgcolor: 'white', color: 'text.primary', boxShadow: 1 }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {NAV_ITEMS.find((n) => n.path === location.pathname)?.label ?? 'MagazineCMS'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }} open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flex: 1, p: 3, mt: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
        {children}
      </Box>
    </Box>
  );
};

export default LayoutShell;
