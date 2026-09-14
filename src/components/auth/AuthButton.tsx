"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthButtonProps {
  className?: string;
  onNavigate?: () => void;
}

export function AuthButton({ className, onNavigate }: AuthButtonProps) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => setIsAuthed(!!data?.user)).catch(() => setIsAuthed(false));
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
        setIsAuthed(!!session?.user)
      );
      return () => sub?.subscription?.unsubscribe();
    } catch {
      setIsAuthed(false);
    }
  }, []);

  async function handleSignOut() {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoading(false);
    onNavigate?.();
    router.push("/");
    router.refresh();
  }

  if (isAuthed === null) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className={cn("h-9 w-9 p-0 shrink-0", className)}
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </Button>
    );
  }

  if (isAuthed) {
    return (
      <Button
        size="sm"
        variant="outline"
        className={cn(
          "h-9 px-3 text-xs sm:text-sm font-medium transition-colors duration-200 hover:bg-muted/80 shrink-0",
          className
        )}
        onClick={handleSignOut}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        ) : (
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
        )}
        <span>Sign Out</span>
      </Button>
    );
  }

  return (
    <Button
      asChild
      size="sm"
      className={cn(
        "h-9 px-3 text-xs sm:text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-98 shadow-sm shrink-0 whitespace-nowrap",
        className
      )}
    >
      <Link href="/auth" onClick={onNavigate} className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <span>Get Started</span>
      </Link>
    </Button>
  );
}
