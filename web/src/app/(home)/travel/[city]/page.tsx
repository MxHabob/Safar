import { Metadata } from "next";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { CityView } from "@/pages/travel-guides/index";

type Props = {
  params: Promise<{
    city: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = (await params).city;

  return {
    title: decodeURIComponent(city),
  };
}

const Page = async ({ params }: Props) => {
  const { city } = await params;

  // Decode URL-encoded params
  const decodedCity = decodeURIComponent(city);

  return (
      <ErrorBoundary fallback={<p>Something went wrong</p>}>
        <Suspense fallback={<p>Loading...</p>}>
          <CityView city={decodedCity} />
        </Suspense>
      </ErrorBoundary>
  );
};

export default Page;
