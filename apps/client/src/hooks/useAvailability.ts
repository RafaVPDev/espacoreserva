import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useAvailability(venueId: string) {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [slots, setSlots] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!venueId) return;

    async function fetch() {
      const { data, error } = await supabase
        .from("available_slots")
        .select("slot_date, slot_time")
        .eq("venue_id", venueId);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const datesSet = new Set<string>();
      const slotsMap: Record<string, string[]> = {};

      for (const row of data ?? []) {
        datesSet.add(row.slot_date);
        const time = (row.slot_time as string).slice(0, 5);
        if (!slotsMap[row.slot_date]) slotsMap[row.slot_date] = [];
        slotsMap[row.slot_date].push(time);
      }

      setAvailableDates([...datesSet]);
      setSlots(slotsMap);
      setLoading(false);
    }

    fetch();
  }, [venueId]);

  return { availableDates, slots, loading, error };
}
