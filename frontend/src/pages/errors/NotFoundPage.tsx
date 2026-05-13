import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArticleIcon from '@mui/icons-material/Article';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <ArticleIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
      <Typography variant="h2" fontWeight={700} color="text.secondary">404</Typography>
      <Typography variant="h5">Page Not Found</Typography>
      <Typography variant="body2" color="text.secondary">The page you're looking for doesn't exist.</Typography>
      <Button variant="contained" onClick={() => navigate('/')}>Go to Dashboard</Button>
    </Box>
  );
};

export default NotFoundPage;
