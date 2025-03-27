import ExperienceCard from "@/components/custom/experience-card";
// import PlaceCard from "@/components/custom/place-card";

export default function Home() {
  const experienceData = {
    id: "1",
    title: "experience, place",
    description: "description of the experience and it's features and other stuff",
    place: {
      id: "1",
      name: "Amazing Place",
    },
    owner: {
      id: "1",
      name: "obaid",
      avatar: "/images/obaid.jfif",
    },
    location: "location of the place",
    price_per_person: 99,
    currency: "USD",
    duration: 1440, // 24 hours = 1 day
    capacity: 10,
    schedule: [
      { day: "Monday", startTime: "09:00", endTime: "17:00" },
      { day: "Wednesday", startTime: "09:00", endTime: "17:00" },
      { day: "Friday", startTime: "09:00", endTime: "17:00" },
    ],
    images: [
      "/images/experince.jpg",
      "/placeholder.svg?height=300&width=400",
      "/placeholder.svg?height=300&width=400",
    ],
    rating: 4.85,
    is_available: true,
    category: "Nature",
  }
  // const placeData = {
  //   id: "1",
  //   name: "Placename",
  //   country: "Country",
  //   city: "City",
  //   region: "Region",
  //   rating: 4.70,
  //   description: "Description of the place and its features and other stuff",
  //   location: "Location of the place",
  //   images: [
  //     "/images/image1.jpg",
  //     "/images/image1.jpg",
  //     "/images/image1.jpg",
  //     "/images/image1.jpg",
  //     "/images/image1.jpg",

  //   ],
  //   is_available: true,
  //   price: 150,
  //   currency: "USD",
  //   category: "cars",
  //   metadata: {
  //     amenities: ["WiFi", "Parking", "Air Conditioning"],
  //   },
  // }

  return (
    
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      {/* <div className="w-full max-w-sm">
        <PlaceCard {...placeData} />
      </div> */}
      <div className="w-full max-w-sm">
        <ExperienceCard {...experienceData} />
      </div>
    </main>
  );
}
