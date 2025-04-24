
import { Clock, MapPin } from "lucide-react";
import Image from "next/image";
export function ItineraryRecommendations() {

  const recommendations = [
    {
      id: 1,
      title: "Classic Rome in 3 Days",
      description: "Perfect for first-time visitors covering all major attractions",
      duration: "3 days",
      places: 12,
      price: "$450",
      rating: 4.8,
      reviews: 1243,
      image: "/rome-cover.jpg"
    },
    {
      id: 2,
      title: "Cultural Highlights of Paris",
      description: "Explore the art, history, and culture of Paris in 5 days",
      duration: "5 days",
      places: 15,
      price: "$800",
      rating: 4.7,
      reviews: 987,
      image: "/paris-cover.jpg"
    },
    {
      id: 3,
      title: "Adventure in the Swiss Alps",
      description: "Experience breathtaking views and outdoor activities in 4 days",
      duration: "4 days",
      places: 8,
      price: "$600",
      rating: 4.9,
      reviews: 654,
      image: "/swiss-alps-cover.jpg"
    },
  ];

  return (
    <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">
          Recommended Itineraries
        </h2>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-48 w-full">
                <Image 
                  src={item.image}
                  alt={item.title}
                  layout="fill"
                  objectFit="cover"
                  className="hover:scale-105 transition-transform duration-300"
                  priority={false}
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{item.duration}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{item.places} places</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">{item.price}</span>
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">★</span>
                    <span>{item.rating}</span>
                    <span className="text-gray-500 ml-1">({item.reviews})</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}