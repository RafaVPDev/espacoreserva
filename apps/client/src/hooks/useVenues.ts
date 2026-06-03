import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Venue = {
  id: string;
  name: string;
  city: string;
  photos: string[] | null;
};

export function useVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from("venues")
        .select("id, name, city, photos")
        .eq("active", true)
        .order("name");

      if (error) setError(error.message);
      else setVenues(data ?? []);

      setLoading(false);
    }

    fetch();
  }, []);

  return { venues, loading, error };
}
