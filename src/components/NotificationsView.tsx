import React from 'react';
import { NotificationItem } from '../types';
import { Bell, CheckCircle2, Info, AlertTriangle, AlertCircle, Clock, Trash2 } from 'lucide-react';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClearNotifications: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAllRead,
  onClearNotifications
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] p-6 rounded-sm border border-white/10">
        <div>
          <div className="flex items-center space-x-2 text-[#C5A059] text-xs font-mono tracking-widest uppercase mb-1">
            <Bell className="w-4 h-4" />
            <span>REAL-TIME NOTIFICATIONS & AGENT ALERTS</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">Notifications Center</h1>
          <p className="text-xs text-white/50 mt-1">Audit logs, AI agent task completions, security findings, and topology changes.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onMarkAllRead}
            className="px-3 py-1.5 text-xs font-mono bg-white/5 hover:bg-white/10 text-white rounded-sm border border-white/10 transition-all uppercase"
          >
            MARK ALL READ
          </button>
          <button
            onClick={onClearNotifications}
            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-sm transition-all"
            title="Clear All"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-[#121212] border border-white/10 rounded-sm text-xs font-mono text-white/40">
            NO NOTIFICATIONS
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              className={`p-5 rounded-sm border transition-all flex items-start space-x-4 ${
                item.read ? 'bg-[#121212]/60 border-white/5' : 'bg-[#121212] border-[#C5A059]/40 shadow-sm'
              }`}
            >
              <div className="pt-0.5">
                {item.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {item.type === 'info' && <Info className="w-5 h-5 text-[#C5A059]" />}
                {item.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                {item.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                  <span className="text-[10px] font-mono text-white/40 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.timestamp}</span>
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{item.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
