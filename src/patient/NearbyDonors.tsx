import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const donors = [
  { name: "Donor A", blood: "O+", distance: "2 km" },
  { name: "Donor B", blood: "A+", distance: "4 km" },
];

const NearbyDonors = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nearby Donors</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {donors.map((d, i) => (
          <div
            key={i}
            className="flex justify-between items-center border rounded-md p-3 text-sm"
          >
            <span>{d.name} ({d.blood})</span>
            <span className="text-muted-foreground">{d.distance}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default NearbyDonors;
