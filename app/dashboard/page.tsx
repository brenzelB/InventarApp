"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardClient } from "./DashboardClient";
import { getDashboardLayout } from "./actions";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [layout, setLayout] = useState<any>(null);
  const [layoutLoading, setLayoutLoading] = useState(true);

  useEffect(() => {
    async function loadLayout() {
      if (user?.id) {
        try {
          const result = await getDashboardLayout(user.id);
          if (result.success && result.layout) {
            setLayout(result.layout);
          }
        } catch (err) {
          console.error("Failed to load layout:", err);
        }
      }
      setLayoutLoading(false);
    }

    if (!authLoading) {
      loadLayout();
    }
  }, [user, authLoading]);

  if (authLoading || layoutLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
        Bitte einloggen.
      </div>
    );
  }

  return <DashboardClient userId={user.id} initialLayout={layout} />;
}
