import { api } from '../config/api';

export const fotodeskService = {
  // 8.1 Auth / Register
  async registerStudio(payload: {
    email: string;
    password: string;
    studioName: string;
    username?: string;
    refCode?: string;
  }) {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  // 8.2 Super Admin
  superadmin: {
    async getOverview() {
      const res = await api.get('/superadmin/overview');
      return res.data;
    },
    async getStudios() {
      const res = await api.get('/superadmin/studios');
      return res.data;
    },
    async getStudioDetail(id: number) {
      const res = await api.get(`/superadmin/studios/${id}`);
      return res.data;
    },
    async updateStudioStatus(id: number, status: 'active' | 'suspended', reason?: string) {
      const res = await api.patch(`/superadmin/studios/${id}/status`, { status, reason });
      return res.data;
    },
    async getUsers() {
      const res = await api.get('/superadmin/users');
      return res.data;
    },
    async updateUserStatus(id: number, isActive: boolean) {
      const res = await api.patch(`/superadmin/users/${id}/status`, { isActive });
      return res.data;
    },
    async getSubscriptions() {
      const res = await api.get('/superadmin/subscriptions');
      return res.data;
    },
    async getAffiliates() {
      const res = await api.get('/superadmin/affiliates');
      return res.data;
    },
    async updateAffiliateStatus(id: number, isActive: boolean) {
      const res = await api.patch(`/superadmin/affiliates/${id}/status`, { isActive });
      return res.data;
    },
    async getCommissions() {
      const res = await api.get('/superadmin/commissions');
      return res.data;
    },
    async approveCommission(id: number) {
      const res = await api.patch(`/superadmin/commissions/${id}/approve`);
      return res.data;
    },
    async getPayouts() {
      const res = await api.get('/superadmin/payouts');
      return res.data;
    },
    async getSettings() {
      const res = await api.get('/superadmin/settings');
      return res.data;
    },
    async updateSettings(settings: Record<string, any>) {
      const res = await api.put('/superadmin/settings', { settings });
      return res.data;
    },
  },

  // 8.3 Video Galleries
  videoGalleries: {
    async list() {
      const res = await api.get('/admin/video-galleries');
      return res.data;
    },
    async create(payload: { title: string; clientName?: string; accessCode?: string; expiresAt?: string }) {
      const res = await api.post('/admin/video-galleries', payload);
      return res.data;
    },
    async getDetail(id: number) {
      const res = await api.get(`/admin/video-galleries/${id}`);
      return res.data;
    },
    async uploadVideo(id: number, formData: FormData) {
      const res = await api.post(`/admin/video-galleries/${id}/videos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    async remove(id: number) {
      const res = await api.delete(`/admin/video-galleries/${id}`);
      return res.data;
    },
  },

  // 8.4 Subscription & Affiliates
  subscription: {
    async get() {
      const res = await api.get('/admin/subscription');
      return res.data;
    },
    async createCheckout(planId: 'pro_monthly') {
      const res = await api.post('/admin/subscription/checkout', { planId });
      return res.data;
    },
  },

  affiliates: {
    async getOverview() {
      const res = await api.get('/admin/affiliates/overview');
      return res.data;
    },
  },

  // 8.5 Team Members & Studio Settings
  teamMembers: {
    async list() {
      const res = await api.get('/admin/team-members');
      return res.data;
    },
    async invite(payload: { email: string; username?: string; password?: string; modulePermissions?: Record<string, any> }) {
      const res = await api.post('/admin/team-members', payload);
      return res.data;
    },
    async updatePermissions(id: number, modulePermissions: Record<string, any>) {
      const res = await api.put(`/admin/team-members/${id}/permissions`, { modulePermissions });
      return res.data;
    },
    async resendInvite(id: number) {
      const res = await api.post(`/admin/team-members/${id}/resend-invite`);
      return res.data;
    },
    async remove(id: number) {
      const res = await api.delete(`/admin/team-members/${id}`);
      return res.data;
    },
  },

  studioSettings: {
    async listSessions() {
      const res = await api.get('/admin/settings/sessions');
      return res.data;
    },
    async revokeSession(id: number) {
      const res = await api.delete(`/admin/settings/sessions/${id}`);
      return res.data;
    },
    async getStudioProfile() {
      const res = await api.get('/admin/settings/studio-profile');
      return res.data;
    },
    async updateStudioProfile(profile: Record<string, any>) {
      const res = await api.put('/admin/settings/studio-profile', profile);
      return res.data;
    },
    async getPreferences(kind: 'account-preferences' | 'notifications' | 'workspace-preferences') {
      const res = await api.get(`/admin/settings/${kind}`);
      return res.data;
    },
    async updatePreferences(kind: 'account-preferences' | 'notifications' | 'workspace-preferences', data: Record<string, any>) {
      const res = await api.put(`/admin/settings/${kind}`, data);
      return res.data;
    },
    async updatePassword(currentPassword: string, newPassword: string) {
      const res = await api.put('/admin/settings/password', { currentPassword, newPassword });
      return res.data;
    },
  },
};

