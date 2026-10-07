import Link from "next/link";
import { AuthFrame } from "@/components/dashboard/AuthFrame";

export default function DashboardNotFound() {
  return (
    <AuthFrame title="Nothing here" lede="This dashboard page doesn't exist.">
      <Link className="dash-btn" href="/dashboard">
        Back to the figures
      </Link>
    </AuthFrame>
  );
}
