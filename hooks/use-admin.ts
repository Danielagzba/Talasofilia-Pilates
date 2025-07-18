"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/auth-context";

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    // If auth is still loading or no user, don't check admin status
    if (authLoading || !user) {
      setIsAdmin(false);
      setLoading(authLoading);
      return;
    }

    // If we already checked this user, don't check again
    if (checkedRef.current === user.id) {
      return;
    }

    const checkAdminStatus = async () => {
      console.log("[useAdmin] Checking admin status for:", user.id);
      setLoading(true);
      setError(null);

      try {
        // Get auth headers
        const { createClient } = await import('@/lib/supabase');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const authHeaders = session?.access_token 
          ? { 'Authorization': `Bearer ${session.access_token}` } 
          : {};
        
        const response = await fetch('/api/auth/check-admin', {
          headers: authHeaders
        });
        
        if (!response.ok && response.status !== 200) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("[useAdmin] Admin check response:", data);
        
        if (data.error) {
          console.error("[useAdmin] Server returned error:", data.error);
          setError(data.error);
        }
        
        setIsAdmin(data.isAdmin);
        checkedRef.current = user.id;
      } catch (err) {
        console.error("[useAdmin] Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading]);

  return { isAdmin, loading, error };
}