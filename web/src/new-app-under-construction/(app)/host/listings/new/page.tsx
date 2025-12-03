import { CreateListingForm } from "@/components/listings/CreateListingForm";

export const metadata = {
  title: "Create Listing",
  description: "Create a new listing",
};

export default function NewListingPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Create Listing</h1>
      <CreateListingForm />
    </div>
  );
}

