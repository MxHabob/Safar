"use client"

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

interface SearchResultItem {
  id: string | number
  name: string
  category?: string
  username?: string
  country?: string
  code?: string
}

export function CommandMenu() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch] = useDebounce(search, 300)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const {
    data: searchData,
    isLoading,
    isError,
  } = api.useUniversalSearchQuery(
    {
      q: debouncedSearch,
      limit: 5,
      types: "users,places,experiences,cities,regions,countries",
    },
    {
      skip: debouncedSearch.length < 2,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  )

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

  React.useEffect(() => {
    if (debouncedSearch.length >= 2) {
      console.log("Search query:", debouncedSearch)
      console.log("Search results:", searchData)
    }
  }, [debouncedSearch, searchData])

  React.useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }, [open])

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


  // React.useEffect(() => {
  //   if (!open) {
  //     setTimeout(() => setSearch(""), 300)
  //   }
  // }, [open])

  const handleSelect = (type: string, item: SearchResultItem) => {
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
  }

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
        {/* <div className="mt-2 text-xs text-muted-foreground text-center">
          <kbd className="rounded border border-muted bg-muted-foreground/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            <span className="mr-0.5">⌘</span>K
          </kbd>{" "}
          to search
        </div> */}
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
        </div>

        <CommandList>
          {isLoading && debouncedSearch.length >= 2 && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {isError && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Something went wrong. Please try again.
            </div>
          )}

          {!isLoading && !isError && debouncedSearch.length >= 2 && (
            <>
              {!hasResults && <CommandEmpty>No results found for &quot;{debouncedSearch}&quot;</CommandEmpty>}

              {users.length > 0 && (
                <CommandGroup heading="Users">
                  {users.map((item) => (
                    <CommandItem
                      key={`user-${item.id}`}
                      onSelect={() => handleSelect("user", item)}
                      className="flex items-center"
                    >
                      <User className="mr-2 h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                      {item.username && <span className="ml-2 text-xs text-muted-foreground">@{item.username}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {places.length > 0 && (
                <CommandGroup heading="Places">
                  {places.map((item) => (
                    <CommandItem
                      key={`place-${item.id}`}
                      onSelect={() => handleSelect("place", item)}
                      className="flex items-center"
                    >
                      <MapPin className="mr-2 h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                      {item.category && <span className="ml-2 text-xs text-muted-foreground">{item.category}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {experiences.length > 0 && (
                <CommandGroup heading="Experiences">
                  {experiences.map((item) => (
                    <CommandItem
                      key={`experience-${item.id}`}
                      onSelect={() => handleSelect("experience", item)}
                      className="flex items-center"
                    >
                      <Compass className="mr-2 h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                      {item.category && <span className="ml-2 text-xs text-muted-foreground">{item.category}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {cities.length > 0 && (
                <CommandGroup heading="Cities">
                  {cities.map((item) => (
                    <CommandItem
                      key={`city-${item.id}`}
                      onSelect={() => handleSelect("city", item)}
                      className="flex items-center"
                    >
                      <Building className="mr-2 h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                      {item.country && <span className="ml-2 text-xs text-muted-foreground">{item.country}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {regions.length > 0 && (
                <CommandGroup heading="Regions">
                  {regions.map((item) => (
                    <CommandItem
                      key={`region-${item.id}`}
                      onSelect={() => handleSelect("region", item)}
                      className="flex items-center"
                    >
                      <Globe className="mr-2 h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                      {item.country && <span className="ml-2 text-xs text-muted-foreground">{item.country}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {countries.length > 0 && (
                <CommandGroup heading="Countries">
                  {countries.map((item) => (
                    <CommandItem
                      key={`country-${item.id}`}
                      onSelect={() => handleSelect("country", item)}
                      className="flex items-center"
                    >
                      <Globe className="mr-2 h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                      {item.code && <span className="ml-2 text-xs text-muted-foreground">{item.code}</span>}
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
