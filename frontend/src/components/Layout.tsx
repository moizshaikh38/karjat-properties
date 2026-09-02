import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Inbox, Users, Map, Building2, 
  CalendarDays, PhoneCall, Megaphone, FileText, 
  Bot, Zap, BarChart3, Users2, Settings, 
  LogOut, Menu, Search, Sun, Moon, ChevronLeft, ChevronRight, X, Sparkles, Plus
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
      flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative
      ${isActive 
        ? 'bg-[var(--color-primary)] text-white font-semibold shadow-sm' 
        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]'
      }
    `}
    title={collapsed ? label : undefined}
  >
    <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105`} />
    {!collapsed && (
      <>
        <span className="ml-3 truncate text-sm">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="ml-auto bg-white/20 text-current py-0.5 px-2 rounded-full text-xs font-bold">
            {badge}
          </span>
        )}
      </>
    )}
  </NavLink>
);

const NavGroup: React.FC<{ title: string; children: React.ReactNode; collapsed: boolean }> = ({ title, children, collapsed }) => (
  <div className="mb-5">
    {!collapsed && (
      <h3 className="px-3 mb-1.5 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
        {title}
      </h3>
    )}
    <div className="space-y-1">{children}</div>
  </div>
);

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
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

  const sidebarWidth = collapsed ? 'w-20' : 'w-64';

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col md:flex-row overflow-hidden font-sans">
      <CommandPalette />
      
      {/* MOBILE TOP BAR */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white shadow-xs">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-sm text-[var(--color-text)] tracking-tight block">Karjat Properties</span>
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              AI Sales Bot Live
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={triggerSearch} 
            className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] rounded-lg"
            title="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <button 
            onClick={toggleTheme} 
            className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] rounded-lg"
            title="Theme"
          >
            {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
          </button>
          <NotificationCenter />
        </div>
      </header>

      {/* DESKTOP SIDEBAR */}
      <aside className={`
        hidden md:flex flex-col flex-shrink-0 ${sidebarWidth} 
        transition-all duration-300 ease-in-out border-r border-[var(--color-border)] bg-[var(--color-surface)] z-20
      `}>
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="font-bold text-base text-[var(--color-text)] tracking-tight block truncate">Karjat Properties</span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  AI CRM Engine
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-4 px-3 hide-scrollbar">
          <NavGroup title="Main" collapsed={collapsed}>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
            <NavItem to="/inbox" icon={Inbox} label="Inbox" badge={3} collapsed={collapsed} />
            <NavItem to="/leads" icon={Users} label="Leads" collapsed={collapsed} />
            <NavItem to="/pipeline" icon={Map} label="Pipeline" collapsed={collapsed} />
            <NavItem to="/properties" icon={Building2} label="Properties" collapsed={collapsed} />
          </NavGroup>

          <NavGroup title="Engagement" collapsed={collapsed}>
            <NavItem to="/site-visits" icon={CalendarDays} label="Site Visits" collapsed={collapsed} />
            <NavItem to="/follow-ups" icon={PhoneCall} label="Follow-ups" collapsed={collapsed} />
            <NavItem to="/campaigns" icon={Megaphone} label="Campaigns" collapsed={collapsed} />
            <NavItem to="/templates" icon={FileText} label="Templates" collapsed={collapsed} />
          </NavGroup>

          <NavGroup title="Intelligence" collapsed={collapsed}>
            <NavItem to="/ai" icon={Bot} label="AI Sales Agent" collapsed={collapsed} />
            <NavItem to="/automation" icon={Zap} label="Automation" collapsed={collapsed} />
            <NavItem to="/analytics" icon={BarChart3} label="Analytics" collapsed={collapsed} />
          </NavGroup>

          <NavGroup title="Admin" collapsed={collapsed}>
            <NavItem to="/team" icon={Users2} label="Team" collapsed={collapsed} />
            <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
          </NavGroup>
        </div>

        {/* User Profile & Collapse Bar */}
        <div className="border-t border-[var(--color-border)] p-3 bg-[var(--color-surface-elevated)] space-y-2">
          <div className={`flex items-center gap-3 p-2 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
            <div className="h-9 w-9 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text)] truncate">{user?.name || 'Administrator'}</p>
                <p className="text-xs text-[var(--color-text-muted)] capitalize truncate">{user?.role || 'Admin'}</p>
              </div>
            )}
            {!collapsed && (
              <button 
                onClick={handleLogout} 
                className="text-[var(--color-text-muted)] hover:text-rose-600 p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors" 
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="w-full flex items-center justify-center p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] rounded-lg transition-colors text-xs font-medium"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <div className="flex items-center gap-1.5"><ChevronLeft className="h-4 w-4" /> <span>Collapse</span></div>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] items-center justify-between px-6 flex-shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={triggerSearch}
              className="flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-text-muted)] transition-all w-72 shadow-xs"
            >
              <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
              <span>Search properties, leads, chats...</span>
              <kbd className="ml-auto text-[10px] font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] px-1.5 py-0.5 rounded text-[var(--color-text-muted)]">⌘K</kbd>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/properties')}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Property
            </button>
            <button
              onClick={() => navigate('/leads')}
              className="px-3 py-1.5 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Lead
            </button>
            <button 
              onClick={toggleTheme} 
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-xl hover:bg-[var(--color-surface-elevated)] transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <NotificationCenter />
          </div>
        </header>

        {/* Content View with Mobile Safe Area Padding */}
        <div className="flex-1 overflow-y-auto bg-[var(--color-bg)] pb-20 md:pb-0 relative hide-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-[var(--color-border)] flex justify-around items-center px-2 py-1.5 z-40 shadow-lg">
        <NavLink 
          to="/dashboard" 
          className={({isActive}) => `flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${isActive ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-muted)]'}`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Overview</span>
        </NavLink>
        <NavLink 
          to="/inbox" 
          className={({isActive}) => `flex flex-col items-center py-1 px-3 rounded-lg relative transition-colors ${isActive ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-muted)]'}`}
        >
          <Inbox className="h-5 w-5" />
          <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
          <span className="text-[10px] mt-0.5">Inbox</span>
        </NavLink>
        <NavLink 
          to="/leads" 
          className={({isActive}) => `flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${isActive ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-muted)]'}`}
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Leads</span>
        </NavLink>
        <NavLink 
          to="/properties" 
          className={({isActive}) => `flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${isActive ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-muted)]'}`}
        >
          <Building2 className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Properties</span>
        </NavLink>
        <button 
          onClick={() => setMobileMenuOpen(true)} 
          className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${mobileMenuOpen ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-muted)]'}`}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </nav>

      {/* MOBILE SLIDE-OVER DRAWER ("MORE MENU") */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="w-4/5 max-w-sm bg-[var(--color-surface)] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-[var(--color-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-[var(--color-text)]">Karjat Properties</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <NavGroup title="Sales & Inventory" collapsed={false}>
                <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/inbox" icon={Inbox} label="Inbox" badge={3} collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/leads" icon={Users} label="Leads CRM" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/pipeline" icon={Map} label="Sales Pipeline" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/properties" icon={Building2} label="Properties Catalog" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
              </NavGroup>

              <NavGroup title="Client Engagement" collapsed={false}>
                <NavItem to="/site-visits" icon={CalendarDays} label="Site Visits" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/follow-ups" icon={PhoneCall} label="Follow-ups" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/campaigns" icon={Megaphone} label="WhatsApp Campaigns" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/templates" icon={FileText} label="Message Templates" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
              </NavGroup>

              <NavGroup title="AI & Intelligence" collapsed={false}>
                <NavItem to="/ai" icon={Bot} label="AI Sales Agent" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/automation" icon={Zap} label="Automation Workflows" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/analytics" icon={BarChart3} label="Performance Analytics" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
              </NavGroup>

              <NavGroup title="Administration" collapsed={false}>
                <NavItem to="/team" icon={Users2} label="Team Management" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
                <NavItem to="/settings" icon={Settings} label="System Settings" collapsed={false} onClick={() => setMobileMenuOpen(false)} />
              </NavGroup>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-xs">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[var(--color-text)] truncate">{user?.name || 'Administrator'}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] truncate">{user?.email || 'admin@example.com'}</p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] rounded-lg"
                >
                  {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl hover:bg-rose-100 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
