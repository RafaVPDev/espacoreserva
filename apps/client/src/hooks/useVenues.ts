import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Amenity = {
  id: string;
  name: string;
  icon: string;
};

type Venue = {
  id: string;
  name: string;
  city: string;
  state: string | null;
  district: string | null;
  photos: string[] | null;
  capacity: number | null;
  description: string | null;
  amenities: Amenity[];
  owner_whatsapp: string | null;
};

export function useVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("venues")
        .select(
          `
          id, name, city, state, district, photos, capacity, description,
          venue_amenities (
            amenities ( id, name, icon )
          ),
          profiles!venues_owner_id_fkey ( whatsapp )
        `,
        )
        .eq("active", true)
        .order("name");

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const mapped = (data ?? []).map((v) => ({
        id: v.id,
        name: v.name,
        city: v.city,
        state: v.state,
        district: v.district,
        photos: v.photos,
        capacity: v.capacity,
        description: v.description,
        amenities: (v.venue_amenities ?? [])
          .map(
            (va: {
              amenities:
                | { id: string; name: string; icon: string }
                | { id: string; name: string; icon: string }[]
                | null;
            }) => {
              const a = va.amenities;
              if (!a) return null;
              if (Array.isArray(a)) return a[0] ?? null;
              return a;
            },
          )
          .filter(Boolean) as Amenity[],
        owner_whatsapp: Array.isArray(v.profiles)
          ? (v.profiles[0]?.whatsapp ?? null)
          : ((v.profiles as { whatsapp: string | null } | null)?.whatsapp ??
            null),
      }));

      setVenues(mapped);
      setLoading(false);
    }

    load();
  }, []);

  return { venues, loading, error };
}
