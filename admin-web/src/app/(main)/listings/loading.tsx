import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="w-full h-full m-auto min-h-[400px] flex items-center justify-center">
      <Spinner />
    </div>
  );
}

