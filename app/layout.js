"use client"
import { useState } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { hasAccess } from '../lib/access-control';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

function ProtectedLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // Don't protect the login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Show loading spinner while checking auth
  if (status === 'loading') {
    return (
      <div className="h-screen w-full bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/40 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user has access to this specific page
  const userHasAccess = hasAccess(session?.user?.email, pathname);

  // Show authenticated layout with sidebar
  return (
    <div className="flex h-screen overflow-hidden">
      {/* SIDEBAR */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative border-r border-white/5 bg-brand-dark/80 backdrop-blur-2xl flex flex-col transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-50 ${
          isHovered ? 'w-72 shadow-[25px_0_60px_rgba(0,0,0,0.8)]' : 'w-2 border-r-brand-blue/20'
        }`}
      >
        {/* Visual Indicator when closed */}
        {!isHovered && (
          <div className="absolute inset-y-0 right-0 w-[2px] bg-gradient-to-b from-transparent via-brand-blue/40 to-transparent animate-pulse" />
        )}

        {/* Sidebar Content */}
        <div className={`flex flex-col h-full transition-opacity duration-300 ${isHovered ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'}`}>
          
          {/* Header */}
          <div className={`p-8 h-32 flex-col justify-center ${isHovered ? 'flex' : 'hidden'}`}>
            <div className="flex items-center gap-3">
              <LayoutGrid size={22} className="text-brand-blue shrink-0 rotate-90" />
              <div>
                <div className="text-xl font-black italic tracking-tighter bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent leading-none">
                  LTE PORTAL
                </div>
                <p className="text-[8px] uppercase tracking-[0.4em] text-brand-blue font-bold mt-1 whitespace-nowrap">
                  Tools Dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar overflow-x-hidden">

            <SidebarSection label="Payroll">
              <SidebarLink href="/bt-payroll" label="BT Payroll" color="bg-[#3b82f6]" restricted />
              <SidebarLink href="/lba-payroll" label="LBA Payroll" color="bg-[#06b6d4]" restricted />
              <SidebarLink href="/bt-fulltime" label="Full Time Checker" color="bg-[#10b981]"/>
              <SidebarLink href="/billable-hours-calculator" label="Billable Hours Calculator" color="bg-[#a855f7]"/>
            </SidebarSection>

            <SidebarSection label="Billing">
              <SidebarLink href="/billing-validator" label="Billing Validator" color="bg-[#34d399]" />
              <SidebarLink href="/billing-scraper" label="Billing Scraper" color="bg-[#fbbf24]" />
            </SidebarSection>

            <SidebarSection label="Quality Assurance">
              <SidebarLink href="/lba-checker" label="LBA Checker" color="bg-[#06b6d4]" />
            </SidebarSection>

            <SidebarSection label="Case Coordination">
              <SidebarLink href="/cancelled-dashboard" label="Coordination Dashboard" color="bg-[#3b82f6]" />
              <SidebarLink href="/bt-automation" label="BT Onboarding" color="bg-[#34d399]" />
            </SidebarSection>

            <SidebarSection label="Tech">
              <SidebarLink href="/inactive-clients" label="Inactive Client List" color="bg-[#f43f5e]" />
            </SidebarSection>
          </nav>

          {/* User Profile */}
          <div className="p-6 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-blue to-brand-cyan flex items-center justify-center text-xs font-bold">
                  {session?.user?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-[140px]">{session?.user?.name || 'Admin'}</p>
                  <p className="text-[10px] text-white/40 truncate max-w-[140px]">{session?.user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut size={16} className="text-white/40 hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-brand-dark min-w-0 h-screen overflow-auto">
        {userHasAccess ? children : <AccessDenied />}
      </main>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="bg-brand-dark text-white antialiased font-sans">
        <SessionProvider>
          <ProtectedLayout>{children}</ProtectedLayout>
        </SessionProvider>
      </body>
    </html>
  );
}

function SidebarSection({ label, children }) {
  return (
    <div>
      <p className="px-4 text-[10px] uppercase tracking-widest text-white/20 font-bold mb-4">
        {label}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SidebarLink({ href, label, color, restricted }) {
  const { data: session } = useSession();
  const userHasAccess = restricted ? hasAccess(session?.user?.email, href) : true;

  // Don't render the link at all if user doesn't have access
  if (restricted && !userHasAccess) {
    return null;
  }

  // Extract hex color from Tailwind class (e.g., "bg-[#3b82f6]" -> "#3b82f6")
  const hexColor = color.match(/#[0-9a-fA-F]{6}/)?.[0] || '#3b82f6';

  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
    >
      <div 
        className="w-1.5 h-1.5 rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-125 transition-all shrink-0"
        style={{
          backgroundColor: hexColor,
          boxShadow: `0 0 8px ${hexColor}`
        }}
      />
      <span className="text-sm font-medium text-white/60 group-hover:text-white transition-all whitespace-nowrap">
        {label}
      </span>
    </Link>
  );
}