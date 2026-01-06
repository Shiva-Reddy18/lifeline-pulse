import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const RequestHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      const { data } = await supabase
        .from("emergencies")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false });

      setHistory(data || []);
    };

    fetchHistory();
  }, [user]);

  return (
    <section className="bg-white border rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">
        Emergency History
      </h2>

      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No emergency requests yet.
        </p>
      ) : (
        history.map((e) => (
          <div
            key={e.id}
            className="flex justify-between p-3 bg-gray-50 rounded-lg mb-2"
          >
            <span>
              {new Date(e.created_at).toLocaleDateString()}
            </span>
            <span className="text-sm">{e.status}</span>
          </div>
        ))
      )}
    </section>
  );
};

export default RequestHistory;
