import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, Button, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  Avatar, Alert, Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';

type Role = 'writer' | 'editor' | 'reviewer' | 'publisher' | 'admin';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  isActive: boolean;
}

const ROLES: { value: Role; label: string; color: 'default' | 'primary' | 'info' | 'warning' | 'error'; description: string }[] = [
  { value: 'writer',    label: 'Writer',    color: 'default',  description: 'Can create and edit own content' },
  { value: 'editor',   label: 'Editor',    color: 'primary',  description: 'Can edit any content and submit for review' },
  { value: 'reviewer', label: 'Reviewer',  color: 'info',     description: 'Can review, approve, and send back content' },
  { value: 'publisher',label: 'Publisher', color: 'warning',  description: 'Can schedule and publish approved content' },
  { value: 'admin',    label: 'Admin',     color: 'error',    description: 'Full access including team management' },
];

const SEED_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Alice Johnson',  email: 'alice@magazine.com',  role: 'editor',    joinedAt: '2024-01-15', isActive: true },
  { id: '2', name: 'Bob Smith',      email: 'bob@magazine.com',    role: 'writer',    joinedAt: '2024-02-01', isActive: true },
  { id: '3', name: 'Carol White',    email: 'carol@magazine.com',  role: 'publisher', joinedAt: '2024-01-10', isActive: true },
  { id: '4', name: 'David Brown',    email: 'david@magazine.com',  role: 'reviewer',  joinedAt: '2024-03-05', isActive: false },
  { id: '5', name: 'Eva Martinez',   email: 'eva@magazine.com',    role: 'writer',    joinedAt: '2024-04-12', isActive: true },
];

function loadMembers(): TeamMember[] {
  try { return JSON.parse(localStorage.getItem('team-members') ?? 'null') ?? SEED_MEMBERS; }
  catch { return SEED_MEMBERS; }
}

const EMPTY_FORM = { name: '', email: '', role: 'writer' as Role };

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(loadMembers);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snack, setSnack] = useState('');

  const persist = (updated: TeamMember[]) => {
    setMembers(updated);
    localStorage.setItem('team-members', JSON.stringify(updated));
  };

  const openAdd = () => { setForm(EMPTY_FORM); setAddOpen(true); };
  const openEdit = (m: TeamMember) => { setEditTarget(m); setForm({ name: m.name, email: m.email, role: m.role }); setAddOpen(true); };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editTarget) {
      persist(members.map((m) => m.id === editTarget.id ? { ...m, ...form } : m));
      setSnack(`${form.name}'s profile updated.`);
    } else {
      const member: TeamMember = { id: Date.now().toString(), ...form, joinedAt: new Date().toISOString().split('T')[0], isActive: true };
      persist([...members, member]);
      setSnack(`${form.name} added to team.`);
    }
    setAddOpen(false);
    setEditTarget(null);
  };

  const handleToggleActive = (id: string) => {
    const updated = members.map((m) => m.id === id ? { ...m, isActive: !m.isActive } : m);
    persist(updated);
  };

  const handleRoleChange = (id: string, role: Role) => {
    persist(members.map((m) => m.id === id ? { ...m, role } : m));
    setSnack('Role updated.');
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const name = members.find((m) => m.id === deleteId)?.name ?? '';
    persist(members.filter((m) => m.id !== deleteId));
    setDeleteId(null);
    setSnack(`${name} removed from team.`);
  };

  const roleInfo = (role: Role) => ROLES.find((r) => r.value === role)!;
  const activeCount = members.filter((m) => m.isActive).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Team Management</Typography>
          <Typography variant="body2" color="text.secondary">{activeCount} active · {members.length} total members</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Invite Member</Button>
      </Box>

      {/* Role legend */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: '12px !important' }}>
          <Typography variant="body2" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <PeopleIcon fontSize="small" color="primary" /> Permission Levels
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {ROLES.map((r) => (
              <Box key={r.value} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Chip label={r.label} size="small" color={r.color} sx={{ height: 20, fontSize: '0.65rem' }} />
                <Typography variant="caption" color="text.secondary">{r.description}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Member</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => {
              const role = roleInfo(member.role);
              return (
                <TableRow key={member.id} hover sx={{ opacity: member.isActive ? 1 : 0.55 }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: member.isActive ? 'primary.main' : 'grey.400', fontSize: 14, fontWeight: 700 }}>
                        {member.name[0].toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{member.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{member.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <Select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as Role)}
                        renderValue={(v) => <Chip label={roleInfo(v as Role).label} size="small" color={roleInfo(v as Role).color} sx={{ height: 20, fontSize: '0.65rem' }} />}
                        variant="standard"
                        disableUnderline
                      >
                        {ROLES.map((r) => (
                          <MenuItem key={r.value} value={r.value}>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{r.label}</Typography>
                              <Typography variant="caption" color="text.secondary">{r.description}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(member.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={<Switch size="small" checked={member.isActive} onChange={() => handleToggleActive(member.id)} />}
                      label={<Typography variant="caption">{member.isActive ? 'Active' : 'Inactive'}</Typography>}
                      sx={{ m: 0 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(member)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Remove from team">
                      <IconButton size="small" color="error" onClick={() => setDeleteId(member.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Add / Edit dialog */}
      <Dialog open={addOpen} onClose={() => { setAddOpen(false); setEditTarget(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Member' : 'Invite Team Member'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Full Name" fullWidth value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
          <TextField label="Email Address" fullWidth type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select value={form.role} label="Role" onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}>
              {ROLES.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{r.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{r.description}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {!editTarget && (
            <Alert severity="info" sx={{ fontSize: '0.78rem' }}>In demo mode, no invitation email is sent. The member is added directly.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddOpen(false); setEditTarget(null); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim() || !form.email.trim()}>
            {editTarget ? 'Save Changes' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm delete */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove <strong>{members.find((m) => m.id === deleteId)?.name}</strong> from the team?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Remove</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
