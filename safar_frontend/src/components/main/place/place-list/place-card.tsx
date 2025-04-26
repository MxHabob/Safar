export const PlaceCard = ({ place }: PlaceCardProps) => {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: place.currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(place.price || 0);

  return (
    <InteractionLink
      href={`/places/${place.id}`}
      className="block w-full h-full"
      interactionType={InteractionType.VIEW_PLACE}
      contentType="safar_place"
      objectId={place.id}
    >
      <div className="flex flex-col w-full h-full rounded-3xl bg-card shadow-md overflow-hidden transition-all hover:shadow-lg">
        
        <MediaGallery
          media={place.media || []}
          variant="carousel"
          aspectRatio="video"
          priority
          showViewAll={false}
          className="relative w-full"
        />

        {/* Badges and Wishlist button */}
        {place?.category?.name && (
          <Badge className="absolute top-3 left-3 px-2 py-1 border-none">
            {place.category.name}
          </Badge>
        )}

        <WishlistButton
          itemId={place.id}
          itemType="place"
          isInwishlist={place.is_in_wishlist || false}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200"
          size="default"
          variant="outline"
        />

        {!place.is_available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-medium text-sm px-3 py-1.5 bg-black/40 rounded-md">
              Not Available
            </span>
          </div>
        )}

        {/* ✨ Content section */}
        <div className="flex flex-col p-4 flex-1">
          <div className="flex justify-between items-start mb-1.5">
            <h3 className="font-semibold text-lg line-clamp-1">
              {place.name}
              {place.country?.name && `, ${place.country.name}`}
            </h3>
            {place.rating !== undefined && (
              <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/30 px-1.5 py-0.5 rounded-md">
                <span className="text-sm font-medium text-yellow-500">★</span>
                <span className="text-sm font-medium">{place.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2.5 line-clamp-2 flex-grow">
            {place.description || "No description available"}
          </p>

          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-3">
            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">{place.location}</span>
          </div>

          <div className="flex justify-between items-center mt-auto">
            <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[60%]">
              {place.city && <span className="mr-1">{place.city.name}</span>}
              {place.city && place.region && <span className="mr-1">,</span>}
              {place.region && <span>{place.region.name}</span>}
            </div>
            <div className="font-semibold text-base">{formattedPrice}</div>
          </div>
        </div>
      </div>
    </InteractionLink>
  );
};

PlaceCard.Skeleton = function PlaceCardSkeleton() {
  return (
    <div className="flex flex-col w-full rounded-3xl bg-card overflow-hidden shadow-md">
      <Skeleton className="h-60 w-full rounded-none" /> {/* Image gallery skeleton */}
      
      <div className="absolute top-3 left-3">
        <Skeleton className="h-6 w-24 rounded-full" /> {/* Badge skeleton */}
      </div>

      <div className="absolute top-3 right-3">
        <Skeleton className="h-8 w-8 rounded-full" /> {/* Wishlist button skeleton */}
      </div>

      <div className="flex flex-col p-4 flex-1">
        <div className="flex justify-between items-start mb-1.5">
          <div className="space-y-1.5 w-full">
            <Skeleton className="h-5 w-3/4 rounded" /> {/* Title skeleton */}
            <Skeleton className="h-3 w-1/2 rounded" /> {/* Subtitle skeleton */}
          </div>
          <Skeleton className="h-5 w-10 rounded-md" /> {/* Rating skeleton */}
        </div>

        <div className="space-y-2 mb-3">
          <Skeleton className="h-3 w-full rounded" /> {/* Description line 1 */}
          <Skeleton className="h-3 w-5/6 rounded" /> {/* Description line 2 */}
        </div>

        <div className="flex items-center mb-3">
          <Skeleton className="h-3.5 w-3.5 rounded-full mr-1" /> {/* Location icon */}
          <Skeleton className="h-3 w-24 rounded" /> {/* Location text */}
        </div>

        <div className="flex justify-between items-center mt-auto">
          <Skeleton className="h-4 w-32 rounded" /> {/* City/region skeleton */}
          <Skeleton className="h-5 w-20 rounded" /> {/* Price skeleton */}
        </div>
      </div>
    </div>
  );
};
