import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Schedule = {
  id: string;
  day_of_week: number;
  shift: string;
  start_time: string;
  end_time: string;
  price: number | null;
  active: boolean;
};

export function useAvailability(venueId: string) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [bookedSlots, setBookedSlots] = useState<
    { date: string; shift: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!venueId) return;

    async function load() {
      const [schedulesRes, bookingsRes] = await Promise.all([
        supabase
          .from("venue_schedules")
          .select("id, day_of_week, shift, start_time, end_time, price, active")
          .eq("venue_id", venueId)
          .eq("active", true),
        supabase
          .from("bookings")
          .select("slot_date, shift")
          .eq("venue_id", venueId)
          .in("status", ["pending", "approved"])
          .not("slot_date", "is", null)
          .not("shift", "is", null),
      ]);

      if (schedulesRes.error) setError(schedulesRes.error.message);
      else setSchedules(schedulesRes.data ?? []);

      setBookedSlots(
        (bookingsRes.data ?? []).map((b) => ({
          date: b.slot_date as string,
          shift: b.shift as string,
        })),
      );

      setLoading(false);
    }

    load();
  }, [venueId]);

  function isShiftBooked(date: string, shift: string) {
    return bookedSlots.some((b) => b.date === date && b.shift === shift);
  }

  return { schedules, bookedSlots, isShiftBooked, loading, error };
}
