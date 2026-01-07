import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function HealthReportAnalyzer() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
const [analysisDone, setAnalysisDone] = useState(false);

  const handleSelectClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // basic validation
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    try {
      setUploading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please login to upload reports");
        setUploading(false);
        return;
      }

      // create storage path
      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      // 1️⃣ Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("health-reports")
        .upload(filePath, file, {
  cacheControl: "3600",
  upsert: false,
});


    if (uploadError) {
  console.error("Storage upload error:", uploadError);
  toast.error(uploadError.message);
  setUploading(false);
  return;
}


      // 2️⃣ Get file URL (private bucket → signed later if needed)
      const { data: urlData } = supabase.storage
        .from("health-reports")
        .getPublicUrl(filePath);

      // 3️⃣ Insert DB record
    const { data: reportData, error: dbError } = await supabase
  .from("health_reports")
  .insert({
    user_id: user.id,
    file_name: file.name,
    file_url: filePath,
    file_type: file.type,
    file_size: file.size,
    status: "uploaded",
  })
  .select()
  .single();

if (dbError || !reportData) {
  toast.error("Failed to save report");
  setUploading(false);
  return;
}
// 🔹 INSERT DUMMY AI ANALYSIS (TEMPORARY)
await supabase.from("health_report_analysis").insert({
  report_id: reportData.id,
  summary: "This medical report shows normal health indicators.",
  risks: "No immediate health risks detected.",
  recommendations: "Maintain a balanced diet and regular exercise.",
  confidence_score: 0.88,
});

// 🔹 UPDATE REPORT STATUS
await supabase
  .from("health_reports")
  .update({ status: "analyzed" })
  .eq("id", reportData.id);
setAnalysisDone(true);


      toast.success("Health report uploaded successfully");

      // reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pt-8 pb-12">

      {/* ================= HEADER ================= */}
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-sm font-medium">
          ✨ AI-Powered Analysis
        </span>

        <h1 className="text-4xl font-bold mt-4">
          Health Report Analyzer
        </h1>

        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
          Upload your medical reports and get instant AI-powered insights and
          personalized recommendations.
        </p>
      </div>

      {/* ================= UPLOAD CARD ================= */}
      <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center shadow-sm">

        <div className="flex flex-col items-center">

          <div className="bg-gray-100 p-4 rounded-xl mb-4">
            <Upload className="w-6 h-6 text-gray-500" />
          </div>

          <p className="text-lg font-medium">
            Drop your report here
          </p>

          <p className="text-sm text-muted-foreground">
            or click to browse files
          </p>

          <button
            type="button"
            onClick={handleSelectClick}
            disabled={uploading}
            className="mt-6 px-6 py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-50 transition disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Select File"}
          </button>

          <p className="text-xs text-muted-foreground mt-4">
            Supports PDF, JPG, PNG • Max 10MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}