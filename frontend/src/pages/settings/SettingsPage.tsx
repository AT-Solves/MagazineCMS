import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Switch, FormControlLabel, Divider, Alert, Tabs, Tab, Avatar,
  Select, MenuItem, FormControl, InputLabel, Chip, Snackbar,
  InputAdornment, IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { useAuthStore } from '../../stores/auth.store';
import { useSettingsStore } from '../../stores/settings.store';
import { LOCALES, PLATFORMS } from '../../constants/magazine';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { profile, org, notifications, security, setProfile, setOrg, setNotifications, setSecurity, hydrateProfile } = useSettingsStore();

  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });

  useEffect(() => {
    if (user) hydrateProfile(user);
  }, [user, hydrateProfile]);

  const save = (msg: string) => setSnack(msg);

  const handlePasswordChange = () => {
    if (!pwForm.current || !pwForm.newPw) { setSnack('Fill in all password fields.'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setSnack('New passwords do not match.'); return; }
    if (pwForm.newPw.length < 8) { setSnack('Password must be at least 8 characters.'); return; }
    setPwForm({ current: '', newPw: '', confirm: '' });
    save('Password updated successfully.');
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>Settings</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Profile" />
        <Tab label="Organisation" />
        <Tab label="Notifications" />
        <Tab label="Security" />
      </Tabs>

      {/* ── Profile ── */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32, mx: 'auto', mb: 2 }}>
                {(profile.fullName || user?.email || 'U')[0].toUpperCase()}
              </Avatar>
              <Typography variant="h6" fontWeight={600}>{profile.fullName || user?.fullName || 'User'}</Typography>
              <Chip label={user?.role ?? 'author'} color="primary" size="small" sx={{ mt: 0.5 }} />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                {org.name} · {org.tier.charAt(0).toUpperCase() + org.tier.slice(1)} Plan
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Profile Information</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField label="Full Name" fullWidth value={profile.fullName} onChange={(e) => setProfile({ fullName: e.target.value })} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Email" fullWidth type="email" value={profile.email} onChange={(e) => setProfile({ email: e.target.value })} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Bio" fullWidth multiline rows={3} value={profile.bio} onChange={(e) => setProfile({ bio: e.target.value })} placeholder="Tell us a bit about yourself…" />
                  </Grid>
                </Grid>
                <Button variant="contained" sx={{ mt: 2 }} onClick={() => save('Profile saved.')}>Save Profile</Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Organisation ── */}
      {tab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Organisation Settings</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Organisation Name" fullWidth value={org.name} onChange={(e) => setOrg({ name: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="URL Slug" fullWidth value={org.slug} onChange={(e) => setOrg({ slug: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Plan Tier</InputLabel>
                  <Select value={org.tier} label="Plan Tier" onChange={(e) => setOrg({ tier: e.target.value as typeof org.tier })}>
                    <MenuItem value="free">Free</MenuItem>
                    <MenuItem value="pro">Pro</MenuItem>
                    <MenuItem value="enterprise">Enterprise</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Max Concurrent Editors" type="number" fullWidth value={org.maxEditors} onChange={(e) => setOrg({ maxEditors: Number(e.target.value) })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Monthly Publish Limit" type="number" fullWidth value={org.monthlyPublishLimit} onChange={(e) => setOrg({ monthlyPublishLimit: Number(e.target.value) })} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Current Volume" fullWidth size="small" value={org.issueVolume} onChange={(e) => setOrg({ issueVolume: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Current Issue" fullWidth size="small" value={org.currentIssueNumber} onChange={(e) => setOrg({ currentIssueNumber: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Default Locale</InputLabel>
                  <Select value={org.defaultLocale} label="Default Locale" onChange={(e) => setOrg({ defaultLocale: e.target.value })}>
                    {LOCALES.map((l) => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Default Platform</InputLabel>
                  <Select value={org.defaultPlatform} label="Default Platform" onChange={(e) => setOrg({ defaultPlatform: e.target.value })}>
                    {PLATFORMS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => save('Organisation settings saved.')}>Save Organisation</Button>
          </CardContent>
        </Card>
      )}

      {/* ── Notifications ── */}
      {tab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Notification Preferences</Typography>
            <Divider sx={{ mb: 2 }} />
            {[
              { key: 'emailOnReview',   label: 'Email when content is submitted for review' },
              { key: 'emailOnPublish',  label: 'Email when content is published' },
              { key: 'emailOnComment',  label: 'Email on new comments' },
              { key: 'emailOnDeadline', label: 'Email 24 hours before deadline' },
            ].map(({ key, label }) => (
              <FormControlLabel
                key={key}
                control={<Switch checked={notifications[key as keyof typeof notifications] as boolean} onChange={(e) => setNotifications({ [key]: e.target.checked })} />}
                label={label} sx={{ display: 'flex', mb: 1 }}
              />
            ))}
            <FormControl size="small" sx={{ width: 200, mt: 1 }}>
              <InputLabel>Digest Frequency</InputLabel>
              <Select value={notifications.digestFrequency} label="Digest Frequency" onChange={(e) => setNotifications({ digestFrequency: e.target.value as typeof notifications.digestFrequency })}>
                <MenuItem value="never">Never</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={() => save('Notification preferences saved.')}>Save Notifications</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Security ── */}
      {tab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Security</Typography>
            <Divider sx={{ mb: 2 }} />
            <FormControlLabel
              control={<Switch checked={security.mfaEnabled} onChange={(e) => setSecurity({ mfaEnabled: e.target.checked })} />}
              label="Enable Two-Factor Authentication (MFA)" sx={{ display: 'flex', mb: 2 }}
            />
            {security.mfaEnabled && <Alert severity="info" sx={{ mb: 2 }}>Scan the QR code in your authenticator app (e.g. Google Authenticator) to complete MFA setup.</Alert>}
            <TextField
              label="Session Timeout (seconds)" type="number" value={security.sessionTimeoutSeconds}
              onChange={(e) => setSecurity({ sessionTimeoutSeconds: Number(e.target.value) })}
              sx={{ mb: 2, width: 260 }}
              helperText="Users are logged out after this period of inactivity"
            />
            <Button variant="contained" sx={{ display: 'block', mb: 3 }} onClick={() => save('Security settings saved.')}>Save Security</Button>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" fontWeight={600} gutterBottom>Change Password</Typography>
            <Grid container spacing={2} sx={{ maxWidth: 420 }}>
              <Grid item xs={12}>
                <TextField
                  label="Current Password" type={showCurrent ? 'text' : 'password'} fullWidth size="small"
                  value={pwForm.current} onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                  InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowCurrent((v) => !v)}>{showCurrent ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="New Password" type={showNew ? 'text' : 'password'} fullWidth size="small"
                  value={pwForm.newPw} onChange={(e) => setPwForm((p) => ({ ...p, newPw: e.target.value }))}
                  helperText="Minimum 8 characters"
                  InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowNew((v) => !v)}>{showNew ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Confirm New Password" type="password" fullWidth size="small"
                  value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                  error={!!pwForm.confirm && pwForm.confirm !== pwForm.newPw}
                  helperText={pwForm.confirm && pwForm.confirm !== pwForm.newPw ? 'Passwords do not match' : ''}
                />
              </Grid>
            </Grid>
            <Button variant="contained" color="warning" sx={{ mt: 2 }} onClick={handlePasswordChange}>Update Password</Button>
          </CardContent>
        </Card>
      )}

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
