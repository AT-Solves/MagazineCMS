import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from './auth.store';

export interface OrgSettings {
  name: string;
  slug: string;
  tier: 'free' | 'pro' | 'enterprise';
  maxEditors: number;
  monthlyPublishLimit: number;
  issueVolume: string;
  currentIssueNumber: string;
  defaultLocale: string;
  defaultPlatform: string;
  logoUrl: string;
  primaryColor: string;
}

export interface NotificationPrefs {
  emailOnReview: boolean;
  emailOnPublish: boolean;
  emailOnComment: boolean;
  emailOnDeadline: boolean;
  digestFrequency: 'never' | 'daily' | 'weekly';
}

export interface SecuritySettings {
  mfaEnabled: boolean;
  sessionTimeoutSeconds: number;
}

interface SettingsStore {
  profile: Pick<AuthUser, 'fullName' | 'email'> & { bio: string };
  org: OrgSettings;
  notifications: NotificationPrefs;
  security: SecuritySettings;
  setProfile: (p: Partial<SettingsStore['profile']>) => void;
  setOrg: (o: Partial<OrgSettings>) => void;
  setNotifications: (n: Partial<NotificationPrefs>) => void;
  setSecurity: (s: Partial<SecuritySettings>) => void;
  hydrateProfile: (user: AuthUser) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      profile: { fullName: '', email: '', bio: '' },
      org: {
        name: 'Demo Magazine',
        slug: 'demo-magazine',
        tier: 'enterprise',
        maxEditors: 25,
        monthlyPublishLimit: 5000,
        issueVolume: '12',
        currentIssueNumber: '6',
        defaultLocale: 'en',
        defaultPlatform: 'web_app',
        logoUrl: '',
        primaryColor: '#2E7D32',
      },
      notifications: {
        emailOnReview: true,
        emailOnPublish: true,
        emailOnComment: false,
        emailOnDeadline: true,
        digestFrequency: 'daily',
      },
      security: { mfaEnabled: false, sessionTimeoutSeconds: 3600 },

      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setOrg: (o) => set((s) => ({ org: { ...s.org, ...o } })),
      setNotifications: (n) => set((s) => ({ notifications: { ...s.notifications, ...n } })),
      setSecurity: (sec) => set((s) => ({ security: { ...s.security, ...sec } })),
      hydrateProfile: (user) =>
        set((s) => ({ profile: { ...s.profile, fullName: user.fullName, email: user.email } })),
    }),
    { name: 'settings-store-v1' },
  ),
);
