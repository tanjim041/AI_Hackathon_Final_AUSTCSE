"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  FileCheck,
  Scale,
  AlertTriangle,
  Bot,
  Menu,
  Sparkles,
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  ShieldCheck,
  Users,
  UserPlus,
  Settings,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth/AuthButton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import type { DbRole } from "@/lib/auth-roles";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  roles: DbRole[];
  exact?: boolean;
};

// All items across roles
const navItems: NavItem[] = [
  // Faculty portal
  { name: "Overview & Profile", href: "/dashboard/faculty", icon: LayoutDashboard, badge: "Faculty", roles: ["faculty"], exact: true },
  { name: "My Courses & Students", href: "/dashboard/faculty/courses", icon: BookOpen, badge: "Faculty", roles: ["faculty"] },
  { name: "Exam Questions & Archive", href: "/dashboard/faculty/questions", icon: FileQuestion, badge: "Faculty", roles: ["faculty"] },
  // Faculty tools
  { name: "Exam Quality", href: "/exam-quality", icon: FileCheck, badge: "Tier 1", roles: ["faculty"] },
  { name: "Grading Consistency", href: "/grading-consistency", icon: Scale, badge: "Tier 1", roles: ["faculty"] },
  { name: "Grade Disputes", href: "/grade-disputes", icon: AlertTriangle, badge: "Tier 1", roles: ["faculty"] },
  { name: "Co-Pilot Chat", href: "/copilot-chat", icon: Bot, badge: "Front-Door", roles: ["faculty"] },
  // Admin console
  { name: "Admin Home", href: "/dashboard/admin", icon: ShieldCheck, badge: "Admin", roles: ["admin"], exact: true },
  { name: "Accounts", href: "/dashboard/admin/users", icon: Users, badge: "Admin", roles: ["admin"] },
  { name: "Courses", href: "/dashboard/admin/courses", icon: BookOpen, badge: "Admin", roles: ["admin"] },
  { name: "Enrollments", href: "/dashboard/admin/enrollments", icon: UserPlus, badge: "Admin", roles: ["admin"] },
  { name: "Settings", href: "/dashboard/admin/settings", icon: Settings, badge: "Admin", roles: ["admin"] },
  // Student portal
  { name: "Overview & Profile", href: "/dashboard/student", icon: LayoutDashboard, badge: "Student", roles: ["student"], exact: true },
  { name: "Exam Marks & Grades", href: "/dashboard/student/grades", icon: FileCheck, badge: "Student", roles: ["student"] },
  { name: "Course Applications", href: "/dashboard/student/courses", icon: BookOpen, badge: "Student", roles: ["student"] },
];

const publicNavItems = [
  { name: "Exam Quality", href: "/exam-quality", icon: FileCheck, badge: "Audit" },
  { name: "Grading Consistency", href: "/grading-consistency", icon: Scale, badge: "Dual Graders" },
  { name: "Grade Disputes", href: "/grade-disputes", icon: AlertTriangle, badge: "Advisory" },
  { name: "Co-Pilot Chat", href: "/copilot-chat", icon: Bot, badge: "AI Assistant" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const moreRef = React.useRef<HTMLDivElement>(null);
  const [role, setRole] = React.useState<DbRole | null>(null);
  const [identity, setIdentity] = React.useState<{ name: string; department: string } | null>(null);

  React.useEffect(() => {
    try {
      const supabase = createClient();

      async function loadRole() {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            setRole(null);
            setIdentity(null);
            return;
          }
          const { data } = await supabase
            .from("profiles")
            .select("role, full_name, department")
            .eq("id", user.id)
            .single();
          setRole((data?.role as DbRole) ?? null);
          setIdentity(
            data ? { name: data.full_name as string, department: (data.department as string) ?? "CSE" } : null
          );
        } catch {
          setRole(null);
          setIdentity(null);
        }
      }

      loadRole();
      const { data: sub } = supabase.auth.onAuthStateChange(() => loadRole());
      return () => sub?.subscription?.unsubscribe();
    } catch {
      setRole(null);
      setIdentity(null);
    }
  }, []);

  // Close "More" dropdown on outside click or escape key
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    }

    if (isMoreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isMoreOpen]);

  // Close dropdown on pathname change
  React.useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  // Filter links for authenticated roles
  const visibleNavItems = role
    ? navItems.filter((item) => item.roles.includes(role))
    : [];

  // For faculty, partition primary tabs and secondary tabs in "More" menu
  const primaryNavItems = role === "faculty"
    ? visibleNavItems.slice(0, 5)
    : visibleNavItems;

  const moreNavItems = role === "faculty"
    ? visibleNavItems.slice(5)
    : [];

  const isMoreActive = moreNavItems.some((item) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-navbar-entrance">
      <div className="mx-auto flex h-16 max-w-7xl 2xl:max-w-[1440px] items-center justify-between px-3 sm:px-6 lg:px-8 gap-2 sm:gap-4">
        {/* Left Cluster: Logo & Desktop Carnival Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/"
            className="group flex items-center gap-2 sm:gap-2.5 transition-transform duration-200 active:scale-95 shrink-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-colors duration-200 group-hover:bg-primary/90 shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5 whitespace-nowrap">
                FacultyOS
              </span>
              <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-widest hidden xs:block whitespace-nowrap">
                Academic Co-Pilot
              </span>
            </div>
          </Link>

          {/* Desktop-only badge (collapses into sheet on mobile/tablet, shown on 2xl to preserve nav room) */}
          <span className="hidden 2xl:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent/15 text-accent border border-accent/30 transition-colors duration-200 shrink-0 whitespace-nowrap">
            <Sparkles className="h-3 w-3" />
            AUST CSE Carnival 8.0
          </span>
        </div>

        {/* Center: Desktop Navigation Links */}
        {primaryNavItems.length > 0 && (
          <nav className="hidden xl:flex items-center gap-1.5 2xl:gap-2">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative h-9 flex items-center gap-1.5 px-3 text-[13px] font-medium rounded-md whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0",
                    isActive
                      ? "text-primary dark:text-primary-foreground font-semibold bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}

            {/* "More" Dropdown Menu for Faculty secondary tabs */}
            {moreNavItems.length > 0 && (
              <div ref={moreRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMoreOpen((prev) => !prev)}
                  aria-expanded={isMoreOpen}
                  aria-haspopup="true"
                  className={cn(
                    "relative h-9 flex items-center gap-1.5 px-3 text-[13px] font-medium rounded-md whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0",
                    isMoreActive || isMoreOpen
                      ? "text-primary dark:text-primary-foreground font-semibold bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <span>More</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200 shrink-0",
                      isMoreOpen && "rotate-180"
                    )}
                  />
                  {isMoreActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                  )}
                </button>

                {isMoreOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1.5 w-56 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 z-50"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Additional Tools
                    </div>
                    {moreNavItems.map((item) => {
                      const ItemIcon = item.icon;
                      const isItemActive = item.exact
                        ? pathname === item.href
                        : pathname === item.href ||
                          (item.href !== "/" && pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setIsMoreOpen(false)}
                          className={cn(
                            "flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors duration-150",
                            isItemActive
                              ? "bg-muted text-primary font-semibold"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <ItemIcon className="h-4 w-4 shrink-0 text-primary" />
                            <span className="whitespace-nowrap">{item.name}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/40 font-normal">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>
        )}

        {/* Right Cluster: Status Indicator + Theme Toggle + Get Started / Sign Out + Hamburger */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Desktop Status Indicator (collapses into sheet on mobile/tablet) */}
          {role === "student" && identity ? (
            <div className="hidden xl:flex h-9 items-center gap-1.5 px-2.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-medium shrink-0 whitespace-nowrap">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              <span className="max-w-[140px] xl:max-w-[180px] truncate">
                Student: {identity.name}
              </span>
            </div>
          ) : (
            <div className="hidden xl:flex h-9 items-center gap-1.5 px-2.5 rounded-md bg-secondary/15 text-secondary border border-secondary/30 text-xs font-medium shrink-0 whitespace-nowrap">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Live Co-Pilot</span>
            </div>
          )}

          {/* Desktop Theme Toggle (collapses into sheet on mobile/tablet) */}
          <div className="hidden xl:flex h-9 items-center shrink-0">
            <ModeToggle />
          </div>

          {/* Primary CTA Button: ALWAYS VISIBLE across all screen widths */}
          <AuthButton className="h-9 text-xs sm:text-sm shrink-0 whitespace-nowrap" />

          {/* Responsive Hamburger Menu (Mobile/Tablet Sheet) */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200 shrink-0"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-[300px] sm:w-[350px] p-0 flex flex-col justify-between"
            >
              <div className="flex flex-col flex-1 overflow-y-auto">
                {/* Sheet Brand Header */}
                <SheetHeader className="p-4 border-b border-border/70">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <SheetTitle className="text-base font-heading font-bold text-foreground">
                        FacultyOS
                      </SheetTitle>
                      <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">
                        Academic Co-Pilot
                      </span>
                    </div>
                  </div>
                </SheetHeader>

                <div className="p-4 space-y-3">
                  {/* Collapsed Badge */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/60 border border-border/60">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                      <Sparkles className="h-3.5 w-3.5" />
                      AUST CSE Carnival 8.0
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-background px-2 py-0.5 rounded border border-border/50">
                      Final Round
                    </span>
                  </div>

                  {/* Collapsed Status Indicator */}
                  {role === "student" && identity ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                      <GraduationCap className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        Student: {identity.name} ({identity.department})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/15 text-secondary border border-secondary/30 text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>System Status</span>
                      </div>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Live Co-Pilot
                      </span>
                    </div>
                  )}

                  {/* Collapsed Theme Toggle Row */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
                    <span className="text-xs font-medium text-foreground">Appearance</span>
                    <ModeToggle />
                  </div>

                  {/* Navigation Links */}
                  <div className="pt-2">
                    <div className="mb-2 px-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {role ? "Navigation" : "Explore Co-Pilot"}
                    </div>

                    <div className="space-y-1">
                      {(visibleNavItems.length > 0 ? visibleNavItems : publicNavItems).map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsSheetOpen(false)}
                            className={cn(
                              "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                              isActive
                                ? "bg-muted text-foreground font-semibold border-l-2 border-primary"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="h-4 w-4 shrink-0" />
                              <span>{item.name}</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
                              {item.badge}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sheet Bottom Footer */}
              <div className="p-4 border-t border-border/70 bg-muted/20 space-y-2">
                <AuthButton
                  className="w-full justify-center"
                  onNavigate={() => setIsSheetOpen(false)}
                />
                <p className="text-center text-[10px] text-muted-foreground">
                  AI Advisory: Final evaluation decision remains with Faculty
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
