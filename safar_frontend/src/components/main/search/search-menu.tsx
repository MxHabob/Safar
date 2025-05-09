"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useDebounce } from "use-debounce"
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
import { cn } from "@/lib/utils"
import type { Country } from "@/core/types"

export function CommandMenu() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch] = useDebounce(search, 300)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Memoize the query options to prevent unnecessary re-renders
  const queryOptions = React.useMemo(
    () => ({
      skip: debouncedSearch.length < 2,
      refetchOnMountOrArgChange: false,
      refetchOnReconnect: false,
    }),
    [debouncedSearch.length],
  )

  // Use the RTK Query hooks with error handling
  const {
    data: placesData,
    isLoading: placesLoading,
    isError: placesError,
  } = api.useGetPlacesQuery({ search: debouncedSearch, page_size: 5 }, queryOptions)

  const {
    data: experiencesData,
    isLoading: experiencesLoading,
    isError: experiencesError,
  } = api.useGetExperiencesQuery({ search: debouncedSearch, page_size: 5 }, queryOptions)

  const {
    data: citiesData,
    isLoading: citiesLoading,
    isError: citiesError,
  } = api.useSearchCitiesQuery({ q: debouncedSearch, limit: 5 }, queryOptions)

  const {
    data: countriesData,
    isLoading: countriesLoading,
    isError: countriesError,
  } = api.useGetCountriesQuery({ search: debouncedSearch, page_size: 5 }, queryOptions)

  // Extract results with fallbacks
  const places = placesData?.results || []
  const experiences = experiencesData?.results || []
  const cities = citiesData?.results || []
  const countries = countriesData?.results || []

  const isLoading = placesLoading || experiencesLoading || citiesLoading || countriesLoading
  const hasError = placesError || experiencesError || citiesError || countriesError
  const hasResults = places.length > 0 || experiences.length > 0 || cities.length > 0 || countries.length > 0

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
      // Small delay to avoid visual flicker when reopening
      setTimeout(() => setSearch(""), 300)
    }
  }, [open])

  const handleSelect = React.useCallback(
    <T extends { id: string | number }>(type: string, item: T) => {
      setOpen(false)

      const routes = {
        place: `/places/${item.id}`,
        experience: `/experiences/${item.id}`,
        city: `/cities/${item.id}`,
        country: `/countries/${item.id}`,
      } as const

      router.push(routes[type as keyof typeof routes])
    },
    [router],
  )


const renderResultGroup = React.useCallback(
  <T extends { 
    id: string | number; 
    name?: string; 
    title?: string;
    country?: Country | string | null;
  }>(
    items: T[],
    type: string,
    heading: string,
    icon: React.ReactNode,
  ) => {
    if (!items.length) return null

    return (
      <CommandGroup heading={heading}>
        {items.map((item) => (
          <CommandItem
            key={`${type}-${item.id}`}
            onSelect={() => handleSelect(type, item)}
            className="flex items-center"
          >
            {icon}
            <span>{item.name || item.title}</span>
            {type === "city" && 
             typeof item.country === "object" && 
             item.country !== null && 
             'name' in item.country && 
             item.country.name && (
              <span className="ml-2 text-xs text-muted-foreground">{item.country.name}</span>
            )}
          </CommandItem>
        ))}
      </CommandGroup>
    )
  },
  [handleSelect],
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
            placeholder="Search places, experiences, cities..."
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
          {isLoading && debouncedSearch.length >= 2 && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {hasError && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Something went wrong. Please try again.
            </div>
          )}

          {!isLoading && !hasError && debouncedSearch.length >= 2 && (
            <>
              {!hasResults && <CommandEmpty>No results found for &quot;{debouncedSearch}&quot;</CommandEmpty>}

              {renderResultGroup(places, "place", "Places", <MapPin className="mr-2 h-4 w-4 shrink-0" />)}
              {renderResultGroup(
                experiences,
                "experience",
                "Experiences",
                <Compass className="mr-2 h-4 w-4 shrink-0" />,
              )}
              {renderResultGroup(cities, "city", "Cities", <Building className="mr-2 h-4 w-4 shrink-0" />)}
              {renderResultGroup(countries, "country", "Countries", <Globe className="mr-2 h-4 w-4 shrink-0" />)}
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
