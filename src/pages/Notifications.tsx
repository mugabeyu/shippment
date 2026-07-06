import React, { useState } from 'react';
import { useNotifications, useAppConfig } from '../hooks/useData';
import { Bell, CheckCheck, Trash2, Package, Users, Gift, Shield, Truck } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{className?: string}>> = {
  Package, Users, Gift, Shield, Truck, Bell
};

export function Notifications() {
  const { notifications, loading, error, unreadCount, markAllRead, deleteNotification } = useNotifications();
  const { config } = useAppConfig();
  const notificationTypes = config?.notification_types || {};
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading notifications...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-navy-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')} className="px-3 py-2 text-sm font-medium text-navy-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            {filter === 'all' ? 'Show Unread' : 'Show All'}
          </button>
          {unreadCount > 0 && (
            <button onClick={() => markAllRead()} className="flex items-center px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-700 transition-colors">
              <CheckCheck className="w-4 h-4 mr-2" /> Mark all as read
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg p-4">
          Failed to load notifications: {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No notifications to display.</div>
        ) : (
          <div className="divide-y divide-slate-200">
             {filtered.map((notification) => {
               const typeConfig = notificationTypes[notification.type] || {};
               const Icon = ICON_MAP[typeConfig.icon] || Bell;
               const color = typeConfig.color || 'bg-slate-100 text-slate-700';
               return (
                 <div key={notification.id} className={`flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}>
                   <div className={`p-2.5 rounded-lg shrink-0 ${color}`}>
                     <Icon className="w-5 h-5" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between mb-1">
                       <h3 className="text-sm font-semibold text-navy-900">{notification.title}</h3>
                       <button onClick={() => deleteNotification(notification.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                     <p className="text-sm text-slate-600 leading-relaxed">{notification.message}</p>
                     <p className="text-xs text-slate-400 mt-1.5">{new Date(notification.createdAt || '').toLocaleString()}</p>
                   </div>
                   {!notification.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2"></span>}
                 </div>
               );
             })}
          </div>
        )}
      </div>
    </div>
  );
}
