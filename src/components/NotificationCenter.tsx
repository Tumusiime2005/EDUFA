import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, Info, ShieldAlert, Award, FileQuestion } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NotificationItem {
  id: number;
  recipientId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationCenter: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (title: string) => {
    if (title.toLowerCase().includes('approved')) {
      return <Award className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (title.toLowerCase().includes('anomaly') || title.toLowerCase().includes('flagged')) {
      return <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0" />;
    }
    if (title.toLowerCase().includes('requested')) {
      return <FileQuestion className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-orange-500/50 hover:bg-neutral-800/80 transition-all cursor-pointer"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5 text-neutral-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-neutral-950 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-84 sm:w-96 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-500" />
                <h4 className="font-semibold text-sm text-neutral-100">Live Notifications</h4>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-medium border border-orange-500/20">
                {unreadCount} unread
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-neutral-800/60">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-sm">
                  No notifications recorded yet.
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 transition-colors text-left flex gap-3 ${
                      item.isRead ? 'bg-transparent text-neutral-400' : 'bg-orange-950/20 text-neutral-200'
                    }`}
                  >
                    <div className="pt-0.5">{getIcon(item.title)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-xs font-semibold ${item.isRead ? 'text-neutral-300' : 'text-neutral-100'}`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                        {item.message}
                      </p>
                      {!item.isRead && (
                        <button
                          onClick={() => markAsRead(item.id)}
                          className="mt-2 text-[11px] text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
