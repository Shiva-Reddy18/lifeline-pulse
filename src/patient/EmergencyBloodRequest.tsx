import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EmergencyBloodRequest = () => {
  const [bloodGroup, setBloodGroup] = useState("");
  const [units, setUnits] = useState("");

  const handleSubmit = async () => {
    if (!bloodGroup || !units) {
      alert("Please fill all fields");
      return;
    }

    try {
      await fetch("/api/blood-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloodGroup, units }),
      });

      alert("Blood request submitted successfully");
      setBloodGroup("");
      setUnits("");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">
          🚨 Emergency Blood Request
        </CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select value={bloodGroup} onValueChange={setBloodGroup}>
          <SelectTrigger>
            <SelectValue placeholder="Select Blood Group" />
          </SelectTrigger>
          <SelectContent>
            {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bg => (
              <SelectItem key={bg} value={bg}>{bg}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Units Required"
          value={units}
          onChange={(e) => setUnits(e.target.value)}
        />

        <Button
          className="bg-red-600 hover:bg-red-700"
          onClick={handleSubmit}
        >
          Request Blood
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmergencyBloodRequest;
