import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ---------------- Types ---------------- */
type DeliveryRow = {
  id: string;
  blood_group: string;
  units: number;
  priority: "emergency" | "normal";
  pickup_name: string;
  pickup_address: string;
  drop_name: string;
  drop_address: string;
  contact_phone: string;
  distance_km: number;
  eta_minutes: number;
  status: "delivered";
  created_at: string;
};

/* ---------------- Demo History ---------------- */
const DEMO_HISTORY: DeliveryRow[] = [
  {
    id: "demo-1",
    blood_group: "O+",
    units: 2,
    priority: "normal",
    pickup_name: "City Blood Bank",
    pickup_address: "MG Road",
    drop_name: "Apollo Hospital",
    drop_address: "Jubilee Hills",
    contact_phone: "9876543210",
    distance_km: 6,
    eta_minutes: 18,
    status: "delivered",
    created_at: new Date().toISOString(),
  },
];

export default function DeliveryHistory() {
  const { toast } = useToast();

  const [history, setHistory] = useState<DeliveryRow[]>(DEMO_HISTORY);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ---------------- Form ---------------- */
  const [form, setForm] = useState({
    blood_group: "O+",
    units: 1,
    priority: "normal" as "normal" | "emergency",
    pickup_name: "",
    pickup_address: "",
    drop_name: "",
    drop_address: "",
    contact_phone: "",
    distance_km: 0,
    eta_minutes: 15,
  });

  /* ---------------- Add Delivery ---------------- */
  const submitNewDelivery = () => {
    if (!form.pickup_name.trim() || !form.drop_name.trim()) {
      toast({
        title: "Missing fields",
        description: "Pickup & Drop are required",
        variant: "destructive",
      });
      return;
    }

    const newRow: DeliveryRow = {
      id: `local-${Date.now()}`,
      blood_group: form.blood_group,
      units: Number(form.units),
      priority: form.priority,
      pickup_name: form.pickup_name,
      pickup_address: form.pickup_address,
      drop_name: form.drop_name,
      drop_address: form.drop_address,
      contact_phone: form.contact_phone,
      distance_km: Number(form.distance_km),
      eta_minutes: Number(form.eta_minutes),
      status: "delivered",
      created_at: new Date().toISOString(),
    };

    setHistory((prev) => [newRow, ...prev]);
    setDialogOpen(false);

    toast({
      title: "Delivery added",
      description: "Saved locally (demo mode)",
    });
  };

  /* ---------------- UI ---------------- */
  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Delivery History</h2>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold">
              + Add Delivery
            </button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Delivery</DialogTitle>
            </DialogHeader>

            {/* FORM GRID */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Field label="Blood Group">
                <Input
                  value={form.blood_group}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, blood_group: e.target.value }))
                  }
                />
              </Field>

              <Field label="Units">
                <Input
                  type="number"
                  min={1}
                  value={form.units}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, units: Number(e.target.value) }))
                  }
                />
              </Field>

              <Field label="Priority">
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      priority: e.target.value as "normal" | "emergency",
                    }))
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="emergency">Emergency</option>
                </select>
              </Field>

              <Field label="ETA (minutes)">
                <Input
                  type="number"
                  min={1}
                  value={form.eta_minutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      eta_minutes: Number(e.target.value),
                    }))
                  }
                />
              </Field>

              <Field label="Pickup Name">
                <Input
                  value={form.pickup_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pickup_name: e.target.value }))
                  }
                />
              </Field>

              <Field label="Pickup Address">
                <Input
                  value={form.pickup_address}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pickup_address: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Drop Name">
                <Input
                  value={form.drop_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, drop_name: e.target.value }))
                  }
                />
              </Field>

              <Field label="Drop Address">
                <Input
                  value={form.drop_address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, drop_address: e.target.value }))
                  }
                />
              </Field>

              <Field label="Contact Phone" span>
                <Input
                  value={form.contact_phone}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      contact_phone: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Distance (km)" span>
                <Input
                  type="number"
                  min={0}
                  value={form.distance_km}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      distance_km: Number(e.target.value),
                    }))
                  }
                />
              </Field>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <DialogClose asChild>
                <button className="px-4 py-2 rounded-md bg-gray-200">
                  Cancel
                </button>
              </DialogClose>

              <button
                onClick={submitNewDelivery}
                className="px-5 py-2 rounded-md bg-green-600 text-white font-semibold"
              >
                Add Delivery
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-3">
        {history.map((h) => (
          <div key={h.id} className="p-4 border rounded-xl">
            <div className="font-semibold">
              {h.blood_group} • {h.units} units • {h.priority}
            </div>
            <div className="text-sm text-gray-600">
              {h.pickup_name} → {h.drop_name}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ---------------- Field ---------------- */
function Field({
  label,
  children,
  span,
}: {
  label: string;
  children: React.ReactNode;
  span?: boolean;
}) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <Label className="mb-1 block">{label}</Label>
      {children}
    </div>
  );
}
