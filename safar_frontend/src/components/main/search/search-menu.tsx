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

  // Fetch search results when the debounced search value changes
  const { data: places, isLoading: placesLoading } = useQuery({
    queryKey: ["places", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return []
      const response = await api.endpoints.getPlaces.initiate({ search: debouncedSearch, page_size: 5 })
      return "data" in response ? response.data.results : []
    },
    enabled: debouncedSearch.length >= 2,
  })

  const { data: experiences, isLoading: experiencesLoading } = useQuery({
    queryKey: ["experiences", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return []
      const response = await api.endpoints.getExperiences.initiate({ search: debouncedSearch, page_size: 5 })
      return "data" in response ? response.data.results : []
    },
    enabled: debouncedSearch.length >= 2,
  })

  const { data: cities, isLoading: citiesLoading } = useQuery({
    queryKey: ["cities", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return []
      const response = await api.endpoints.searchCities.initiate({ q: debouncedSearch, limit: 5 })
      return "data" in response ? response.data.results : []
    },
    enabled: debouncedSearch.length >= 2,
  })

  const { data: countries, isLoading: countriesLoading } = useQuery({
    queryKey: ["countries", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return []
      const response = await api.endpoints.getCountries.initiate({ search: debouncedSearch, page_size: 5 })
      return "data" in response ? response.data.results : []
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
      <Button
        variant="outline"
        className="relative h-10 w-full justify-start rounded-md px-4 text-sm text-muted-foreground sm:pr-12 md:w-64 lg:w-80"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search places, experiences, cities...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
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
                  {places.map((place) => (
                    <CommandItem key={`place-${place.id}`} onSelect={() => handleSelect("place", place)}>
                      <MapPin className="mr-2 h-4 w-4" />
                      <span>{place.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {experiences && experiences.length > 0 && (
                <CommandGroup heading="Experiences">
                  {experiences.map((experience) => (
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
                  {cities.map((city) => (
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
                  {countries.map((country) => (
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
