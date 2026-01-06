import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  profile: {
    full_name: string;
    email: string;
    phone: string;
    blood_group: string;
    address: string;
  };
};

export default function PatientProfileCard({ profile }: Props) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* PROFILE HEADER */}
      <Card className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 text-xl font-bold flex items-center justify-center">
            {profile.full_name[0]}
          </div>

          <div>
            <h2 className="text-xl font-semibold">{profile.full_name}</h2>
            <p className="text-sm text-muted-foreground">Patient</p>
            <span className="inline-block mt-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-600">
              {profile.blood_group}
            </span>
          </div>
        </div>

        <Button variant="outline">Edit Profile</Button>
      </Card>

      {/* CONTACT INFO */}
      <Card className="p-6 space-y-3">
        <h3 className="font-semibold">Contact Information</h3>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Phone:</strong> {profile.phone}</p>
        <p><strong>Address:</strong> {profile.address}</p>
      </Card>
    </div>
  );
}
