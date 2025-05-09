"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react"
import { useRouter } from "next/navigation"
import { useDebounce } from "use-debounce"
import { MapPin, Compass, Globe, Building, Search, Loader2, User } from "lucide-react"

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
import { cn } from "@/lib/utils"

export function CommandMenu() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch] = useDebounce(search, 300)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const {
    data: searchData,
    isLoading: isSearching,
    isError: searchError,
  } = api.useUniversalSearchQuery(
    {
      q: debouncedSearch,
      limit: 5,
      types: "users,places,experiences,cities,regions,countries",
    },
    {
      skip: debouncedSearch.length < 2,
      refetchOnMountOrArgChange: false,
      refetchOnReconnect: false,
    },
  )

  // Extract results with fallbacks
  const users = searchData?.results?.users || []
  const places = searchData?.results?.places || []
  const experiences = searchData?.results?.experiences || []
  const cities = searchData?.results?.cities || []
  const regions = searchData?.results?.regions || []
  const countries = searchData?.results?.countries || []

  const hasResults =
    users.length > 0 ||
    places.length > 0 ||
    experiences.length > 0 ||
    cities.length > 0 ||
    regions.length > 0 ||
    countries.length > 0

  // Focus the search input when the dialog opens
  React.useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 0)
    }
  }, [open])

  // Keyboard shortcut handler
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

  // Reset search when dialog closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => setSearch(""), 300)
    }
  }, [open])

  // Navigation handler
  const handleSelect = React.useCallback(
    (type: string, item: { id: string | number }) => {
      setOpen(false)

      const routes: Record<string, string> = {
        user: `/users/${item.id}`,
        place: `/places/${item.id}`,
        experience: `/experiences/${item.id}`,
        city: `/cities/${item.id}`,
        region: `/regions/${item.id}`,
        country: `/countries/${item.id}`,
      }

      router.push(routes[type] || "/")
    },
    [router],
  )

  return (
    <>
      <div className="relative mx-auto max-w-4xl">
        <div className="flex items-center rounded-full bg-card shadow-lg transition-shadow hover:shadow-xl">
          <div className="flex-1 px-6 py-3">
            <div className="text-sm font-medium">Where</div>
            <input
              type="text"
              placeholder="Search destinations"
              className="w-full border-none p-0 text-sm focus:outline-none focus:ring-0"
              onClick={() => setOpen(true)}
              aria-label="Open search dialog"
            />
          </div>
          <Button
            className="absolute right-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#34E0D8] text-white hover:bg-[#2bc8c1] transition-colors"
            onClick={() => setOpen(true)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground text-center">
          <kbd className="rounded border border-muted bg-muted-foreground/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            <span className="mr-0.5">⌘</span>K
          </kbd>{" "}
          to search
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            ref={searchInputRef}
            placeholder="Search places, experiences, cities, users..."
            value={search}
            onValueChange={setSearch}
            className="flex-1 border-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {search && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" onClick={() => setSearch("")}>
              Clear
            </Button>
          )}
        </div>

        <CommandList>
          {isSearching && debouncedSearch.length >= 2 && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {searchError && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Something went wrong. Please try again.
            </div>
          )}

          {!isSearching && !searchError && debouncedSearch.length >= 2 && (
            <>
              {!hasResults && <CommandEmpty>No results found for &quot;{debouncedSearch}&quot;</CommandEmpty>}

              {users.length > 0 && (
                <CommandGroup heading="Users">
                  {users.map((user : any) => (
                    <CommandItem
                      key={`user-${user.id}`}
                      onSelect={() => handleSelect("user", user)}
                      className="flex items-center"
                    >
                      <User className="mr-2 h-4 w-4 shrink-0" />
                      <span>{user.name}</span>
                      {user.username && <span className="ml-2 text-xs text-muted-foreground">@{user.username}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {places.length > 0 && (
                <CommandGroup heading="Places">
                  {places.map((place: any) => (
                    <CommandItem
                      key={`place-${place.id}`}
                      onSelect={() => handleSelect("place", place)}
                      className="flex items-center"
                    >
                      <MapPin className="mr-2 h-4 w-4 shrink-0" />
                      <span>{place.name}</span>
                      {place.category && <span className="ml-2 text-xs text-muted-foreground">{place.category}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {experiences.length > 0 && (
                <CommandGroup heading="Experiences">
                  {experiences.map((experience: any) => (
                    <CommandItem
                      key={`experience-${experience.id}`}
                      onSelect={() => handleSelect("experience", experience)}
                      className="flex items-center"
                    >
                      <Compass className="mr-2 h-4 w-4 shrink-0" />
                      <span>{experience.name}</span>
                      {experience.category && (
                        <span className="ml-2 text-xs text-muted-foreground">{experience.category}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {cities.length > 0 && (
                <CommandGroup heading="Cities">
                  {cities.map((city: any) => (
                    <CommandItem
                      key={`city-${city.id}`}
                      onSelect={() => handleSelect("city", city)}
                      className="flex items-center"
                    >
                      <Building className="mr-2 h-4 w-4 shrink-0" />
                      <span>{city.name}</span>
                      {city.country && <span className="ml-2 text-xs text-muted-foreground">{city.country}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {regions.length > 0 && (
                <CommandGroup heading="Regions">
                  {regions.map((region: any) => (
                    <CommandItem
                      key={`region-${region.id}`}
                      onSelect={() => handleSelect("region", region)}
                      className="flex items-center"
                    >
                      <Globe className="mr-2 h-4 w-4 shrink-0" />
                      <span>{region.name}</span>
                      {region.country && <span className="ml-2 text-xs text-muted-foreground">{region.country}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {countries.length > 0 && (
                <CommandGroup heading="Countries">
                  {countries.map((country: any) => (
                    <CommandItem
                      key={`country-${country.id}`}
                      onSelect={() => handleSelect("country", country)}
                      className="flex items-center"
                    >
                      <Globe className="mr-2 h-4 w-4 shrink-0" />
                      <span>{country.name}</span>
                      {country.code && <span className="ml-2 text-xs text-muted-foreground">{country.code}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}

          <CommandSeparator className={cn(debouncedSearch.length < 2 ? "mt-0" : "")} />

          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => router.push("/places/popular")}>
              <MapPin className="mr-2 h-4 w-4 shrink-0" />
              <span>Popular Places</span>
            </CommandItem>
            <CommandItem onSelect={() => router.push("/experiences/trending")}>
              <Compass className="mr-2 h-4 w-4 shrink-0" />
              <span>Trending Experiences</span>
            </CommandItem>
            <CommandItem onSelect={() => router.push("/destinations")}>
              <Globe className="mr-2 h-4 w-4 shrink-0" />
              <span>Top Destinations</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
