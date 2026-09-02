import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Inbox, Users, Map, Building2, 
  Calendar, PhoneCall, Megaphone, FileText, 
  Bot, Zap, BarChart3, Users2, Settings, 
  LogOut, Search, Sun, Moon, ChevronLeft, ChevronRight, Menu, X, Plus, Layers
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationCenter } from './NotificationCenter';
import { CommandPalette } from './CommandPalette';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  collapsed: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, badge, collapsed, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `
      flex items-center px-2.5 py-1.5 rounded-[6px] transition-all group relative select-none
      ${isActive 
        ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text)] font-medium border border-[var(--color-border)] shadow-[0_1px_2px_0_rgba(0,0,0,0.15)]' 
        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]/50 border border-transparent'
      }
    `}
    title={collapsed ? label : undefined}
  >
    <Icon className="h-4 w-4 flex-shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors" />
    {!collapsed && (
      <>
        <span className="ml-2.5 truncate text-[12.5px]">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="ml-auto bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30 py-0.2 px-1.5 rounded-[3px] text-[10.5px] font-medium font-mono">
            {badge}
          </span>
        )}
      </>
    )}
  </NavLink>
);

const NavSection: React.FC<{ title: string; collapsed: boolean; children: React.ReactNode }> = ({ title, collapsed, children }) => (
  <div className="space-y-0.5 pt-3 first:pt-0">
    {!collapsed && (
      <div className="px-2.5 pb-1 text-[10.5px] font-medium text-[var(--color-text-muted)]/70 uppercase tracking-wider">
        {title}
      </div>
    )}
    <div className="space-y-0.5">{children}</div>
  </div>
);

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { setTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const triggerSearch = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  const sidebarWidth = collapsed ? 'w-14' : 'w-56';

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col md:flex-row overflow-hidden font-sans text-[var(--color-text)]">
      <CommandPalette />
      
      {/* MOBILE TOP BAR (High Precision & Fast Touch) */}
      <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[4px] bg-[var(--color-accent)] flex items-center justify-center text-white">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-[13px] text-[var(--color-text)] tracking-tight block font-display">
              Karjat Properties
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={triggerSearch} 
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-[4px]"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <button 
            onClick={toggleTheme} 
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-[4px]"
            title="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4 text-[var(--color-status-warm)]" /> : <Moon className="h-4 w-4" />}
          </button>
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-[4px]"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* DESKTOP SIDEBAR (Structured Navigation Hub) */}
      <aside className={`
        hidden md:flex flex-col flex-shrink-0 ${sidebarWidth} 
        transition-all duration-200 ease-out border-r border-[var(--color-border)] bg-[var(--color-surface)] z-20 select-none
      `}>
        {/* Brand Header */}
        <div className="h-12 flex items-center justify-between px-3.5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-6 h-6 rounded-[4px] bg-[var(--color-accent)] flex items-center justify-center text-white flex-shrink-0">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="font-semibold text-[13px] text-[var(--color-text)] tracking-tight block truncate font-display">
                  Karjat Properties
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Structured Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-1 hide-scrollbar">
          
          <NavSection title="Operations" collapsed={collapsed}>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Overview" collapsed={collapsed} />
            <NavItem to="/inbox" icon={Inbox} label="Inbox" badge={3} collapsed={collapsed} />
            <NavItem to="/properties" icon={Building2} label="Properties" collapsed={collapsed} />
            <NavItem to="/leads" icon={Users} label="Leads" collapsed={collapsed} />
            <NavItem to="/pipeline" icon={Layers} label="Pipeline" collapsed={collapsed} />
            <NavItem to="/site-visits" icon={Calendar} label="Site Visits" collapsed={collapsed} />
          </NavSection>

          <NavSection title="Engagement" collapsed={collapsed}>
            <NavItem to="/followups" icon={PhoneCall} label="Follow-ups" collapsed={collapsed} />
            <NavItem to="/campaigns" icon={Megaphone} label="Campaigns" collapsed={collapsed} />
            <NavItem to="/templates" icon={FileText} label="Templates" collapsed={collapsed} />
          </NavSection>

          <NavSection title="Intelligence" collapsed={collapsed}>
            <NavItem to="/ai" icon={Bot} label="AI Sales Agent" collapsed={collapsed} />
            <NavItem to="/automation" icon={Zap} label="Automation" collapsed={collapsed} />
            <NavItem to="/analytics" icon={BarChart3} label="Analytics" collapsed={collapsed} />
          </NavSection>

          <NavSection title="Organization" collapsed={collapsed}>
            <NavItem to="/team" icon={Users2} label="Team" collapsed={collapsed} />
            <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
          </NavSection>

        </div>

        {/* User Account & Collapse Bar */}
        <div className="border-t border-[var(--color-border)] p-2 bg-[var(--color-surface)] space-y-1">
          <div className={`flex items-center gap-2 p-1.5 rounded-[4px] ${collapsed ? 'justify-center' : ''}`}>
            <div className="h-6 w-6 rounded-[3px] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center font-medium text-[11px] flex-shrink-0">
              {user?.name?.charAt(0) || 'M'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[var(--color-text)] truncate">{user?.name || 'Moiz Shaikh'}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] capitalize truncate">{user?.role || 'Broker Lead'}</p>
              </div>
            )}
            {!collapsed && (
              <button 
                onClick={handleLogout} 
                className="text-[var(--color-text-muted)] hover:text-[var(--color-status-hot)] p-1 rounded-[4px] hover:bg-[var(--color-surface-elevated)] transition-colors cursor-pointer" 
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="w-full flex items-center justify-center p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] rounded-[4px] transition-colors text-[11px] cursor-pointer"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <div className="flex items-center gap-1"><ChevronLeft className="h-3.5 w-3.5" /> <span>Collapse</span></div>}
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden bg-[var(--color-bg)]">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex h-12 bg-[var(--color-surface)] border-b border-[var(--color-border)] items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={triggerSearch}
              className="flex items-center gap-2 px-2.5 py-1 text-[12px] text-[var(--color-text-muted)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[6px] hover:border-[var(--color-text-muted)] transition-colors w-64 cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              <span className="truncate">Search properties, leads, visits...</span>
              <kbd className="ml-auto text-[10px] font-medium bg-[var(--color-surface)] border border-[var(--color-border)] px-1 py-0.2 rounded text-[var(--color-text-muted)]">⌘K</kbd>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] bg-[var(--color-surface-elevated)] px-2 py-0.5 rounded-[4px] border border-[var(--color-border)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
              <span>Fast2SMS Gateway Active</span>
            </div>

            <button 
              onClick={toggleTheme} 
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-[4px] hover:bg-[var(--color-surface-elevated)] transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4 text-[var(--color-status-warm)]" /> : <Moon className="h-4 w-4" />}
            </button>
            
            <NotificationCenter />
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0 relative hide-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex justify-around items-center px-1 py-1.5 z-40">
        <NavLink 
          to="/dashboard" 
          className={({isActive}) => `flex flex-col items-center py-1 px-2.5 rounded-[4px] transition-colors ${isActive ? 'text-[var(--color-accent)] font-semibold' : 'text-[var(--color-text-muted)]'}`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-[10px] mt-0.5">Overview</span>
        </NavLink>
        <NavLink 
          to="/inbox" 
          className={({isActive}) => `flex flex-col items-center py-1 px-2.5 rounded-[4px] transition-colors ${isActive ? 'text-[var(--color-accent)] font-semibold' : 'text-[var(--color-text-muted)]'}`}
        >
          <Inbox className="h-4 w-4" />
          <span className="text-[10px] mt-0.5">Inbox</span>
        </NavLink>
        <NavLink 
          to="/properties" 
          className={({isActive}) => `flex flex-col items-center py-1 px-2.5 rounded-[4px] transition-colors ${isActive ? 'text-[var(--color-accent)] font-semibold' : 'text-[var(--color-text-muted)]'}`}
        >
          <Building2 className="h-4 w-4" />
          <span className="text-[10px] mt-0.5">Properties</span>
        </NavLink>
        <NavLink 
          to="/leads" 
          className={({isActive}) => `flex flex-col items-center py-1 px-2.5 rounded-[4px] transition-colors ${isActive ? 'text-[var(--color-accent)] font-semibold' : 'text-[var(--color-text-muted)]'}`}
        >
          <Users className="h-4 w-4" />
          <span className="text-[10px] mt-0.5">Leads</span>
        </NavLink>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center py-1 px-2.5 rounded-[4px] transition-colors ${mobileMenuOpen ? 'text-[var(--color-accent)] font-semibold' : 'text-[var(--color-text-muted)]'}`}
        >
          <Menu className="h-4 w-4" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>

      {/* MOBILE SLIDE-OVER DRAWER (Full Access Hub) */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px] flex justify-end animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="w-4/5 max-w-xs bg-[var(--color-surface)] h-full flex flex-col border-l border-[var(--color-border)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
              <span className="font-semibold text-[13px] text-[var(--color-text)] font-display">Karjat Properties</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-[4px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 hide-scrollbar">
              <NavSection title="Operations" collapsed={false}>
                <NavItem to="/dashboard" icon={LayoutDashboard} label="Overview" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/inbox" icon={Inbox} label="Inbox" badge={3} collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/properties" icon={Building2} label="Properties" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/leads" icon={Users} label="Leads" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/pipeline" icon={Layers} label="Pipeline" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/site-visits" icon={Calendar} label="Site Visits" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
              </NavSection>

              <NavSection title="Engagement" collapsed={false}>
                <NavItem to="/followups" icon={PhoneCall} label="Follow-ups" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/campaigns" icon={Megaphone} label="Campaigns" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/templates" icon={FileText} label="Templates" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
              </NavSection>

              <NavSection title="Intelligence" collapsed={false}>
                <NavItem to="/ai" icon={Bot} label="AI Sales Agent" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/automation" icon={Zap} label="Automation" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/analytics" icon={BarChart3} label="Analytics" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
              </NavSection>

              <NavSection title="Organization" collapsed={false}>
                <NavItem to="/team" icon={Users2} label="Team" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/settings" icon={Settings} label="Settings" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
              </NavSection>
            </div>

            <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--color-text-muted)] truncate">{user?.email || 'admin@karjatproperties.com'}</span>
                <button
                  onClick={toggleTheme}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  {isDark ? <Sun className="h-3.5 w-3.5 text-[var(--color-status-warm)]" /> : <Moon className="h-3.5 w-3.5" />}
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-status-hot)] text-[12px] font-medium rounded-[4px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
