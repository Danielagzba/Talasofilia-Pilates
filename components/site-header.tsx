"use client";

import Link from "next/link";
import { Menu, User, LogOut, Calendar, ShoppingBag, History } from "lucide-react";
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

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/20 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="font-serif text-xl md:text-2xl font-light">
          Talasofilia <span className="font-medium italic">Pilates</span>
        </Link>

        {isMobile ? (
          <Sheet>
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
                <Link href="/" className="text-lg font-medium">
                  Home
                </Link>
                <Link href="/about" className="text-lg font-medium">
                  About
                </Link>
                <Link href="/classes" className="text-lg font-medium">
                  Classes
                </Link>
                <Link href="/pricing" className="text-lg font-medium">
                  Pricing
                </Link>
                <Link href="/contact" className="text-lg font-medium">
                  Contact
                </Link>
                {user ? (
                  <>
                    <div className="mt-6 border-t pt-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Signed in as {user.email}
                      </p>
                      <Link href="/dashboard" className="block text-lg font-medium mb-4">
                        Dashboard
                      </Link>
                      <Link href="/dashboard/book-class" className="block text-lg font-medium mb-4">
                        Book a Class
                      </Link>
                      <Link href="/dashboard/my-classes" className="block text-lg font-medium mb-4">
                        My Classes
                      </Link>
                      <Link href="/dashboard/buy-classes" className="block text-lg font-medium mb-4">
                        Buy Classes
                      </Link>
                      <Link href="/dashboard/purchase-history" className="block text-lg font-medium mb-4">
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
                  <Button asChild className="mt-4 rounded-none">
                    <Link href="/login">Login</Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="flex items-center gap-6">
            <Link
              href="/about"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              About
            </Link>
            <Link
              href="/classes"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              Classes
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium hover:underline underline-offset-4"
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
                    <Link href="/dashboard/book-class" className="cursor-pointer">
                      <Calendar className="mr-2 h-4 w-4" />
                      Book a Class
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/my-classes" className="cursor-pointer">
                      <Calendar className="mr-2 h-4 w-4" />
                      My Classes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/buy-classes" className="cursor-pointer">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Buy Classes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/purchase-history" className="cursor-pointer">
                      <History className="mr-2 h-4 w-4" />
                      Purchase History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
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
