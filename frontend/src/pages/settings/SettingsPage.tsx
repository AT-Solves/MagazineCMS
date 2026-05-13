import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Switch, FormControlLabel, Divider, Alert, Tabs, Tab, Avatar,
  Select, MenuItem, FormControl, InputLabel, Chip, Snackbar,
  InputAdornment, IconButton, Paper,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PaletteIcon from '@mui/icons-material/Palette';
import UploadIcon from '@mui/icons-material/Upload';

interface BrandKit {
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  tagline: string;
}

const FONT_OPTIONS = [
  { value: '"Georgia", serif',              label: 'Georgia (Classic Serif)' },
  { value: '"Playfair Display", serif',     label: 'Playfair Display (Elegant)' },
  { value: '"Roboto", sans-serif',          label: 'Roboto (Modern Sans)' },
  { value: '"Merriweather", serif',         label: 'Merriweather (Editorial)' },
  { value: '"Lato", sans-serif',            label: 'Lato (Clean Sans)' },
];

function loadBrandKit(): BrandKit {
  try { return JSON.parse(localStorage.getItem('brand-kit') ?? 'null') ?? { logoUrl: '', primaryColor: '#2E7D32', accentColor: '#1565C0', fontFamily: '"Georgia", serif', tagline: '' }; }
  catch { return { logoUrl: '', primaryColor: '#2E7D32', accentColor: '#1565C0', fontFamily: '"Georgia", serif', tagline: '' }; }
}

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
  const [brandKit, setBrandKit] = useState<BrandKit>(loadBrandKit);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
        <Tab icon={<PaletteIcon fontSize="small" />} iconPosition="start" label="Brand Kit" />
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

      {/* ── Brand Kit ── */}
      {tab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Brand Identity</Typography>
                <Divider sx={{ mb: 2 }} />

                <Typography variant="body2" fontWeight={500} gutterBottom>Logo</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  {brandKit.logoUrl ? (
                    <Box component="img" src={brandKit.logoUrl} alt="Logo" sx={{ height: 56, maxWidth: 160, objectFit: 'contain', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.5 }} />
                  ) : (
                    <Box sx={{ width: 160, height: 56, border: '2px dashed', borderColor: 'divider', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="caption" color="text.disabled">No logo</Typography>
                    </Box>
                  )}
                  <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => logoInputRef.current?.click()}>
                    Upload Logo
                  </Button>
                  {brandKit.logoUrl && (
                    <Button size="small" color="error" onClick={() => setBrandKit((b) => ({ ...b, logoUrl: '' }))}>Remove</Button>
                  )}
                  <input ref={logoInputRef} type="file" hidden accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setBrandKit((b) => ({ ...b, logoUrl: URL.createObjectURL(file) }));
                  }} />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" fontWeight={500} gutterBottom>Primary Colour</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box component="input" type="color" value={brandKit.primaryColor} onChange={(e) => setBrandKit((b) => ({ ...b, primaryColor: e.target.value }))} sx={{ width: 48, height: 40, border: 'none', cursor: 'pointer', borderRadius: 1 }} />
                      <TextField size="small" value={brandKit.primaryColor} onChange={(e) => setBrandKit((b) => ({ ...b, primaryColor: e.target.value }))} sx={{ width: 120 }} inputProps={{ pattern: '#[0-9a-fA-F]{6}' }} />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" fontWeight={500} gutterBottom>Accent Colour</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box component="input" type="color" value={brandKit.accentColor} onChange={(e) => setBrandKit((b) => ({ ...b, accentColor: e.target.value }))} sx={{ width: 48, height: 40, border: 'none', cursor: 'pointer', borderRadius: 1 }} />
                      <TextField size="small" value={brandKit.accentColor} onChange={(e) => setBrandKit((b) => ({ ...b, accentColor: e.target.value }))} sx={{ width: 120 }} inputProps={{ pattern: '#[0-9a-fA-F]{6}' }} />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Brand Font</InputLabel>
                      <Select value={brandKit.fontFamily} label="Brand Font" onChange={(e) => setBrandKit((b) => ({ ...b, fontFamily: e.target.value }))}>
                        {FONT_OPTIONS.map((f) => <MenuItem key={f.value} value={f.value} sx={{ fontFamily: f.value }}>{f.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Brand Tagline" fullWidth value={brandKit.tagline} onChange={(e) => setBrandKit((b) => ({ ...b, tagline: e.target.value }))} placeholder="e.g. Inspiring Young Minds Through Stories" helperText="Shown in footers and social previews" />
                  </Grid>
                </Grid>
                <Button variant="contained" sx={{ mt: 2 }} startIcon={<PaletteIcon />} onClick={() => { localStorage.setItem('brand-kit', JSON.stringify(brandKit)); save('Brand kit saved.'); }}>
                  Save Brand Kit
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Live preview */}
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Live Preview</Typography>
                <Divider sx={{ mb: 2 }} />
                <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#fafafa' }}>
                  {/* Magazine header mockup */}
                  <Box sx={{ borderBottom: `3px solid ${brandKit.primaryColor}`, pb: 1.5, mb: 2 }}>
                    {brandKit.logoUrl ? (
                      <Box component="img" src={brandKit.logoUrl} alt="Logo preview" sx={{ height: 36, maxWidth: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Typography sx={{ fontFamily: brandKit.fontFamily, fontWeight: 700, fontSize: '1.4rem', color: brandKit.primaryColor }}>
                        {org.name || 'Magazine CMS'}
                      </Typography>
                    )}
                    {brandKit.tagline && (
                      <Typography variant="caption" color="text.secondary" display="block">{brandKit.tagline}</Typography>
                    )}
                  </Box>
                  <Typography sx={{ fontFamily: brandKit.fontFamily, fontSize: '1.1rem', fontWeight: 700, mb: 0.75 }}>
                    Sample Article Headline
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: brandKit.fontFamily, mb: 1 }}>
                    A compelling subtitle that draws readers into the story and sets the tone for what follows.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5 }}>
                    <Chip label="Science" size="small" sx={{ bgcolor: brandKit.primaryColor, color: 'white', height: 20, fontSize: '0.65rem' }} />
                    <Chip label="Featured" size="small" sx={{ bgcolor: brandKit.accentColor, color: 'white', height: 20, fontSize: '0.65rem' }} />
                  </Box>
                  <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${brandKit.primaryColor}33` }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: brandKit.fontFamily }}>
                      {brandKit.tagline || '© Magazine CMS'}
                    </Typography>
                  </Box>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
