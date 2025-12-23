import Loader from "@/components/kokonutui/loader";

export default function Loading() {
  return (
    <div className="min-h-svh flex items-center justify-center">
      <Loader title="Loading dashboard..." subtitle="Fetching your data" />
    </div>
  );
}


