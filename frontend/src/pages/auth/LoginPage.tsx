import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField, Button, Typography, Alert, CircularProgress, Box,
  InputAdornment, IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuthStore } from '../../stores/auth.store';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Invalid credentials. Try admin@demo.com / admin123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Sign In</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Sign in to your editorial workspace
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        label="Email" type="email" fullWidth margin="normal"
        value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
      />
      <TextField
        label="Password" fullWidth margin="normal" required
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                edge="end"
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button
        type="submit" variant="contained" fullWidth size="large"
        sx={{ mt: 2 }} disabled={loading}
      >
        {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
      </Button>
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Demo credentials: admin@demo.com / admin123
        </Typography>
      </Box>
    </form>
  );
};

export default LoginPage;
