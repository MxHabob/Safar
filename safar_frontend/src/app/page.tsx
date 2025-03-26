import PlaceCard from "@/components/custom/place-card";
import { Header } from "@/components/section/header";

export default function Home() {
  const placeData = {
    id: "1",
    name: "Placename",
    country: "Country",
    city: "City",
    region: "Region",
    rating: 4.85,
    description: "Description of the place and its features and other stuff",
    location: "Location of the place",
    images: [
      "/images/image1.jpg",
      "/images/image1.jpg",
      "/images/image1.jpg",
      "/images/image1.jpg",
      "/images/image1.jpg",

    ],
    is_available: true,
    price: 150,
    currency: "USD",
    category: "cars",
    metadata: {
      amenities: ["WiFi", "Parking", "Air Conditioning"],
    },
  }
  return (
    <main className="w-full h-full">
      <Header/>
    </main>
  );
}
