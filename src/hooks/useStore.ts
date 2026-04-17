import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { type TeamRole } from "@/lib/teamPermissions";

interface UseStoreResult {
  store: any | null;
  role: TeamRole;
  loading: boolean;
  isOwner: boolean;
}

export const useStore = (): UseStoreResult => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [role, setRole] = useState<TeamRole>("owner");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchStore = async () => {
      const { data: ownedStore } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ownedStore) {
        setStore(ownedStore);
        setRole("owner");
        setLoading(false);
        return;
      }

      const { data: membership } = await supabase
        .from("team_members")
        .select("store_id, role")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (membership) {
        const { data: teamStore } = await supabase
          .from("stores")
          .select("*")
          .eq("id", membership.store_id)
          .maybeSingle();

        if (teamStore) {
          setStore(teamStore);
          setRole(membership.role as TeamRole);
          setLoading(false);
          return;
        }
      }

      navigate("/setup");
    };

    fetchStore();
  }, [user, authLoading, navigate]);

  return { store, role, loading, isOwner: role === "owner" };
};
