import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

type Profile = {
  id: string;
  full_name: string;
  role: "super_admin" | "venue_owner";
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetch() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user!.id)
        .single();

      if (error) console.error("useProfile error:", error);
      setProfile(data);
      setLoading(false);
    }

    fetch();
  }, [user]);

  return { profile, loading };
}
