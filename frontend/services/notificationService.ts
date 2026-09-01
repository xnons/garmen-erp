import api from './api';

export type Severity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface NotificationItem {
  id: number;
  type: string;
  severity: Severity;
  title: string;
  body?: string | null;
  ref_type?: string | null;
  ref_id?: string | null;
  menu_hint?: string | null;
  is_read: boolean;
  created_at?: string | null;
}

export interface NotificationList {
  unread_count: number;
  items: NotificationItem[];
}

export const notificationService = {
  list: (unreadOnly = false) =>
    api.get<NotificationList>('/api/notifications', { params: { unread_only: unreadOnly } }).then((r) => r.data),
  markRead: (id: number) => api.post(`/api/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post('/api/notifications/read-all').then((r) => r.data),
  scan: () => api.post('/api/notifications/scan').then((r) => r.data),
};

export default notificationService;
