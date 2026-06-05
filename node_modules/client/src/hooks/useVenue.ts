import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Venue = {
  name: string;
  city: string;
  min_advance_hours: number | null;
};

export function useVenue(venueId: string) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) return;
    async function fetch() {
      const { data } = await supabase
        .from("venues")
        .select("name, city, min_advance_hours")
        .eq("id", venueId)
        .single();
      setVenue(data);
      setLoading(false);
    }
    fetch();
  }, [venueId]);

  return { venue, loading };
}
