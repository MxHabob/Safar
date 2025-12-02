import { CreateTravelPlanForm } from "@/components/travel-plans/CreateTravelPlanForm";

export const metadata = {
  title: "Create Travel Plan",
  description: "Create a new AI travel plan",
};

export default function NewTravelPlanPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Create Travel Plan</h1>
      <CreateTravelPlanForm />
    </div>
  );
}

