'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  Flame, 
  Bell, 
  Sun, 
  Moon, 
  LogOut, 
  Terminal, 
  Bot, 
  Settings, 
  Menu, 
  X, 
  Check,
  ChevronRight,
  Sparkles,
  History,
  Loader2,
  Trash2,
  User as UserIcon
} from 'lucide-react';
import styles from './AppShell.module.css';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  streak: number;
}

interface Notification {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface AppShellProps {
  user: User;
  notifications: Notification[];
  targetExamsList: { id: string; name: string; code: string }[];
  children: React.ReactNode;
}

export default function AppShell({ user, notifications: initialNotifications, targetExamsList, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeLogId = searchParams.get('id');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  
  // Track active page title
  const [pageTitle, setPageTitle] = useState('Dashboard');

  // History state
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [hoveredLogId, setHoveredLogId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.history || []);
      }
    } catch (err) {
      console.error('Error fetching sidebar history:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    const handleUpdate = () => {
      fetchHistory();
    };
    window.addEventListener('history-updated', handleUpdate);
    return () => window.removeEventListener('history-updated', handleUpdate);
  }, []);

  const handleSelectHistory = (logId: string) => {
    router.push(`/dashboard?id=${logId}`);
  };

  const handleDeleteHistory = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this analysis run from your history?')) return;
    try {
      const res = await fetch(`/api/history?id=${logId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchHistory();
        if (activeLogId === logId) {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      console.error('Error deleting history log:', err);
    }
  };

  useEffect(() => {
    // Read theme from html attribute (which was set by head script)
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
    setTheme(currentTheme || 'dark');
  }, []);

  useEffect(() => {
    // Close mobile menu on path changes
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);

    // Update page title based on pathname
    if (pathname.startsWith('/dashboard')) setPageTitle('Dashboard');
    else if (pathname.startsWith('/exams')) setPageTitle('Exam Modules');
    else if (pathname.startsWith('/quiz')) setPageTitle('Quiz Engine');
    else if (pathname.startsWith('/coding')) setPageTitle('Coding Arena');
    else if (pathname.startsWith('/ai-tutor')) setPageTitle('AI Learning Companion');
    else if (pathname.startsWith('/admin')) setPageTitle('Admin Control Center');
    else if (pathname.startsWith('/topics')) setPageTitle('Topic Review');
  }, [pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark as read locally first
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setIsNotificationsOpen(false);
      // Fire API call in background
      await fetch('/api/user/notifications/read', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navLinks = [
    { href: '/dashboard', label: 'Predictor Workspace', icon: Terminal },
  ];

  // If Admin role, add admin dashboard link
  if (user.role === 'ADMIN') {
    navLinks.push({ href: '/admin', label: 'Admin Console', icon: Settings });
  }

  // Custom Award icon replacement in Lucide since we want to be safe
  function AwardIcon(props: any) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    );
  }

  return (
    <div className={styles.appContainer}>
      {/* Sidebar - Desktop */}
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>
              <Terminal size={18} className={styles.logoPulse} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', userSelect: 'none' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: '1.15rem', letterSpacing: '0.08em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                Amaterasu
              </span>
            </div>
          </div>
          <button 
            className={styles.closeMenuBtn}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '0 20px', margin: '10px 0 20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        </div>

        <nav className={styles.navMenu}>
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                <Icon size={18} className={styles.navIcon} />
                <span>{link.label}</span>
                {isActive && <ChevronRight size={14} className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar History Logs */}
        <div style={{ padding: '0 20px', marginTop: '16px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            <History size={12} />
            <span>Analysis History</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {loadingLogs && logs.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
              </div>
            ) : logs.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '10px 0', textAlign: 'center' }}>
                No recent runs
              </div>
            ) : (
              logs.map((log) => {
                const isSelected = activeLogId === log.id;
                const isHovered = hoveredLogId === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => handleSelectHistory(log.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      transition: 'all 0.2s',
                      border: `1px solid ${isSelected ? '#5C5470' : 'transparent'}`,
                      background: isSelected ? 'rgba(92, 84, 112, 0.4)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      setHoveredLogId(log.id);
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(92, 84, 112, 0.4)';
                        e.currentTarget.style.borderColor = '#5C5470';
                      }
                    }}
                    onMouseLeave={(e) => {
                      setHoveredLogId(null);
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {log.problem_name.split('\n')[0] || 'Untitled Problem'}
                      </div>
                      {(isHovered || isSelected) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHistory(log.id);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                          title="Delete History Log"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span style={{ color: '#818cf8' }}>{log.bug_type}</span>
                      <span>{new Date(log.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1f2937', color: '#9ca3af' }}>
              <UserIcon size={18} />
            </div>
            <div className={styles.userData}>
              <div className={styles.userName}>{user.name}</div>
              <span className={`${styles.roleBadge} ${user.role === 'ADMIN' ? styles.adminBadge : ''}`}>
                {user.role}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Sign Out">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Header / Navbar */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button 
              className={styles.mobileMenuToggle}
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <h1 className={styles.headerTitle}>{pageTitle}</h1>
          </div>

          <div className={styles.headerRight}>
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className={styles.iconButton}
              title={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Night Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications Bell */}
            <div className={styles.notificationsWrapper}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                className={styles.iconButton}
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className={styles.bellBadge}>{unreadCount}</span>}
              </button>

              {isNotificationsOpen && (
                <div className={styles.notificationsDropdown}>
                  <div className={styles.dropdownHeader}>
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className={styles.markReadBtn}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className={styles.notificationsList}>
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`${styles.notificationItem} ${!notif.isRead ? styles.notifUnread : ''}`}
                        >
                          <div className={styles.notifDot}></div>
                          <div className={styles.notifContent}>
                            <p className={styles.notifText}>{notif.message}</p>
                            <span className={styles.notifTime}>
                              {new Date(notif.createdAt).toLocaleDateString(undefined, { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.emptyNotifications}>
                        No notifications yet. Keep studying!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className={styles.pageBody}>
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
