"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Menu,
  User,
  LogOut,
  Calendar,
  ShoppingBag,
  History,
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useMobile } from "../hooks/use-mobile";
import { useAuth } from "../contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";

export function SiteHeader() {
  const isMobile = useMobile();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Close sheet when user changes (e.g., after sign out)
  useEffect(() => {
    setSheetOpen(false);
  }, [user]);

  const handleSignOut = async () => {
    try {
      console.log('Starting sign out process');
      
      // Close the sheet first to ensure UI updates
      setSheetOpen(false);
      
      // Wait for the signOut to complete
      await signOut();
      
      console.log('Sign out completed, navigating to home');
      
      // Use router.refresh() to ensure the page updates
      router.refresh();
      
      // Then navigate to home
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };

  return (
    <header className="bg-stone-50 overflow-x-hidden">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 max-w-full">
        <Link href="/" className="font-serif text-xl md:text-2xl font-light flex-shrink-0">
          Talasofilia <span className="font-medium italic">Pilates</span>
        </Link>

        {isMobile ? (
          <Sheet key={user ? 'authenticated' : 'unauthenticated'} open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[400px] bg-white"
            >
              <nav className="flex flex-col gap-6 mt-12">
                <Link href="/" className="text-lg font-medium" onClick={() => setSheetOpen(false)}>
                  Home
                </Link>
                <Link href="/about" className="text-lg font-medium" onClick={() => setSheetOpen(false)}>
                  About
                </Link>
                <Link href="/classes" className="text-lg font-medium" onClick={() => setSheetOpen(false)}>
                  Classes
                </Link>
                <Link href="/pricing" className="text-lg font-medium" onClick={() => setSheetOpen(false)}>
                  Pricing
                </Link>
                <Link href="/contact" className="text-lg font-medium" onClick={() => setSheetOpen(false)}>
                  Contact
                </Link>
                {user ? (
                  <>
                    <div className="mt-6 border-t pt-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Signed in as {user.email}
                      </p>
                      <Link
                        href="/dashboard"
                        className="block text-lg font-medium mb-4"
                        onClick={() => setSheetOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/book-class"
                        className="block text-lg font-medium mb-4"
                        onClick={() => setSheetOpen(false)}
                      >
                        Book a Class
                      </Link>
                      <Link
                        href="/dashboard/my-classes"
                        className="block text-lg font-medium mb-4"
                        onClick={() => setSheetOpen(false)}
                      >
                        My Classes
                      </Link>
                      <Link
                        href="/dashboard/buy-classes"
                        className="block text-lg font-medium mb-4"
                        onClick={() => setSheetOpen(false)}
                      >
                        Buy Classes
                      </Link>
                      <Link
                        href="/dashboard/purchase-history"
                        className="block text-lg font-medium mb-4"
                        onClick={() => setSheetOpen(false)}
                      >
                        Purchase History
                      </Link>
                      <Button
                        onClick={handleSignOut}
                        variant="outline"
                        className="mt-4 w-full rounded-none"
                      >
                        Sign Out
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button asChild className="mt-4 rounded-none" onClick={() => setSheetOpen(false)}>
                    <Link href="/login">Login</Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link
              href="/about"
              className="text-sm font-medium hover:underline underline-offset-4 whitespace-nowrap"
            >
              About
            </Link>
            <Link
              href="/classes"
              className="text-sm font-medium hover:underline underline-offset-4 whitespace-nowrap"
            >
              Classes
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium hover:underline underline-offset-4 whitespace-nowrap"
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium hover:underline underline-offset-4 whitespace-nowrap"
            >
              Contact
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">My Account</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/book-class"
                      className="cursor-pointer"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Book a Class
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/my-classes"
                      className="cursor-pointer"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      My Classes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/buy-classes"
                      className="cursor-pointer"
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Buy Classes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/purchase-history"
                      className="cursor-pointer"
                    >
                      <History className="mr-2 h-4 w-4" />
                      Purchase History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="rounded-none">
                <Link href="/login">Login</Link>
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
