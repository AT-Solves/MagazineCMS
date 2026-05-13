import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #1565C0 100%)',
    }}
  >
    <Paper
      elevation={8}
      sx={{ p: 5, width: '100%', maxWidth: 420, borderRadius: 3 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
        <ArticleIcon sx={{ color: 'primary.main', fontSize: 36 }} />
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary.dark">
            MagazineCMS
          </Typography>
          <Typography variant="caption" color="text.secondary">
            AI-Powered Editorial Platform
          </Typography>
        </Box>
      </Box>
      {children}
    </Paper>
  </Box>
);

export default AuthLayout;
