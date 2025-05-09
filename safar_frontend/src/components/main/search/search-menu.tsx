"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useDebounce } from "use-debounce"
import { useQuery } from "@tanstack/react-query"
import { MapPin, Compass, Globe, Building, Search, Loader2 } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { api } from "@/core/services/api"
import type { City, Country, Experience, Place } from "@/core/types"

export function CommandMenu() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch] = useDebounce(search, 300)

  const { data: places, isLoading: placesLoading } = useQuery({
    queryKey: ["places", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return []
      const response = await api.endpoints.getPlaces.initiate({ search: debouncedSearch, page_size: 5 })
      return "data" in response ? response?.data?.results : []
    },
    enabled: debouncedSearch.length >= 2,
  })

  const { data: experiences, isLoading: experiencesLoading } = useQuery({
    queryKey: ["experiences", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return []
      const response = await api.endpoints.getExperiences.initiate({ search: debouncedSearch, page_size: 5 })
      return "data" in response ? response?.data?.results : []
    },
    enabled: debouncedSearch.length >= 2,
  })

  const { data: cities, isLoading: citiesLoading } = useQuery({
    queryKey: ["cities", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return []
      const response = await api.endpoints.searchCities.initiate({ q: debouncedSearch, limit: 5 })
      return "data" in response ? response?.data?.results : []
    },
    enabled: debouncedSearch.length >= 2,
  })

  const { data: countries, isLoading: countriesLoading } = useQuery({
    queryKey: ["countries", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return []
      const response = await api.endpoints.getCountries.initiate({ search: debouncedSearch, page_size: 5 })
      return "data" in response ? response?.data?.results : []
    },
    enabled: debouncedSearch.length >= 2,
  })

  const isLoading = placesLoading || experiencesLoading || citiesLoading || countriesLoading

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (type: string, item: Place | Experience | City | Country) => {
    setOpen(false)

    switch (type) {
      case "place":
        router.push(`/places/${item.id}`)
        break
      case "experience":
        router.push(`/experiences/${item.id}`)
        break
      case "city":
        router.push(`/cities/${item.id}`)
        break
      case "country":
        router.push(`/countries/${item.id}`)
        break
    }
  }

  return (
    <>
      <div className="relative mx-auto max-w-4xl">
          <div className="flex items-center rounded-full bg-card shadow-lg">
            <div className="flex-1 px-6 py-3">
              <div className="text-sm font-medium">Where</div>
              <input
                type="text"
                placeholder="Search destinations"
                className="w-full border-none p-0 text-sm focus:outline-none focus:ring-0"
                onClick={() => setOpen(true)}
              />
            </div>
            <Button className="absolute right-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#34E0D8] " onClick={() => setOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search places, experiences, cities..." value={search} onValueChange={setSearch} />
        <CommandList>
          {isLoading && debouncedSearch.length >= 2 && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && debouncedSearch.length >= 2 && (
            <>
              {!places?.length && !experiences?.length && !cities?.length && !countries?.length && (
                <CommandEmpty>No results found.</CommandEmpty>
              )}

              {places && places.length > 0 && (
                <CommandGroup heading="Places">
                  {places.map((place : Place) => (
                    <CommandItem key={`place-${place.id}`} onSelect={() => handleSelect("place", place)}>
                      <MapPin className="mr-2 h-4 w-4" />
                      <span>{place.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {experiences && experiences.length > 0 && (
                <CommandGroup heading="Experiences">
                  {experiences.map((experience : Experience) => (
                    <CommandItem
                      key={`experience-${experience.id}`}
                      onSelect={() => handleSelect("experience", experience)}
                    >
                      <Compass className="mr-2 h-4 w-4" />
                      <span>{experience.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {cities && cities.length > 0 && (
                <CommandGroup heading="Cities">
                  {cities.map((city : City) => (
                    <CommandItem key={`city-${city.id}`} onSelect={() => handleSelect("city", city)}>
                      <Building className="mr-2 h-4 w-4" />
                      <span>{city.name}</span>
                      {typeof city.country === "object" && city.country?.name && (
                        <span className="ml-2 text-xs text-muted-foreground">{city.country.name}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {countries && countries.length > 0 && (
                <CommandGroup heading="Countries">
                  {countries.map((country : Country) => (
                    <CommandItem key={`country-${country.id}`} onSelect={() => handleSelect("country", country)}>
                      <Globe className="mr-2 h-4 w-4" />
                      <span>{country.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => router.push("/places/popular")}>
              <MapPin className="mr-2 h-4 w-4" />
              <span>Popular Places</span>
            </CommandItem>
            <CommandItem onSelect={() => router.push("/experiences/trending")}>
              <Compass className="mr-2 h-4 w-4" />
              <span>Trending Experiences</span>
            </CommandItem>
            <CommandItem onSelect={() => router.push("/destinations")}>
              <Globe className="mr-2 h-4 w-4" />
              <span>Top Destinations</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
