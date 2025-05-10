"use client"

import { MapPin, Clock, Plane, Package } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { WishlistItemProps } from "./types"
import Image from "next/image"
import Link from "next/link"
import { WishlistButton } from "@/components/global/wishlist-button"

export function WishlistItem({ item }: WishlistItemProps) {
  const itemType = item.place ? "place" : item.experience ? "experience" : item.flight ? "flight" : "box"

  const itemData = item.place || item.experience || item.flight || item.box

  if (!itemData) return null

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getItemDetails = () => {
    switch (itemType) {
      case "place":
        return {
          id: item.place?.id,
          title: item.place?.name,
          image: item.place?.media?.[0]?.url || "",
          location: `${item.place?.city?.name || ""}, ${item.place?.country?.name || ""}`,
          price: formatPrice(item.place?.price || 0, item.place?.currency || "USD"),
          badge: "Place",
          badgeColor: "",
          icon: <MapPin className="h-5 w-5 " />,
          link: `/places/${item.place?.id}`,
        }
      case "experience":
        return {
          id: item.experience?.id,
          title: item.experience?.title,
          image: item.experience?.media?.url || "",
          location: `${item.experience?.city?.name || ""}, ${item.experience?.country?.name || ""}`,
          price: formatPrice(item.experience?.price_per_person || 0, item.experience?.currency || "USD"),
          badge: "Experience",
          badgeColor: "",
          icon: <Clock className="h-5 w-5 " />,
          link: `/experiences/${item.experience?.id}`,
        }
      case "flight":
        return {
          id: item.flight?.id,
          title: `${item.flight?.flight_number}: ${item.flight?.departure_airport} to ${item.flight?.arrival_airport}`,
          image: "",
          location: `${item.flight?.departure_airport} → ${item.flight?.arrival_airport}`,
          price: formatPrice(item.flight?.price || 0, item.flight?.currency || "USD"),
          badge: "Flight",
          badgeColor: "",
          icon: <Plane className="h-5 w-5 " />,
          link: `/flights/${item.flight?.id}`,
        }
      case "box":
        return {
          id: item.box?.id,
          title: item.box?.name,
          image: item.box?.media?.[0]?.url || "",
          location: `${item.box?.city?.name || ""}, ${item.box?.country?.name || ""}`,
          price: formatPrice(item.box?.total_price || 0, item.box?.currency || "USD"),
          badge: "Travel Box",
          badgeColor: "",
          icon: <Package className="h-5 w-5" />,
          link: `/boxes/${item.box?.id}`,
        }
      default:
        return null
    }
  }

  const details = getItemDetails()
  if (!details) return null

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={details.image || "/placeholder.svg"}
          alt={details.title || "Wishlist item"}
          className="object-cover"
          fill
        />
        <div className="">
          <Badge className={details.badgeColor}>{details.badge}</Badge>
        </div>
        <WishlistButton
        itemId={details.id || ""} 
        itemType={itemType} 
        isInwishlist={true}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100  transition-all duration-200"
        variant={"secondary"}
        size="default"
        />
      </div>
      <CardContent className="p-4">
        <Link href={details.link} className="hover:underline">
          <h3 className="font-semibold text-lg line-clamp-1">{details.title}</h3>
        </Link>
        <div className="flex items-center mt-2 text-muted-foreground text-sm">
          {details.icon}
          <span className="ml-1">{details.location}</span>
        </div>
        <div className="mt-2 font-medium text-lg">{details.price}</div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Link href={details.link}>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
