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

// Type definitions for search results
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

  // Fetch search results
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
    },
  )

  // Extract results with fallbacks
  const results = React.useMemo(() => {
    if (!searchData?.results) return {}

    return {
      users: searchData.results.users || [],
      places: searchData.results.places || [],
      experiences: searchData.results.experiences || [],
      cities: searchData.results.cities || [],
      regions: searchData.results.regions || [],
      countries: searchData.results.countries || [],
    }
  }, [searchData])

  const hasResults = React.useMemo(() => {
    if (!results) return false
    return Object.values(results).some((group) => group.length > 0)
  }, [results])

  // Focus the search input when the dialog opens
  React.useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
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

  // Render result group if it has items
  const renderResultGroup = (title: string, items: SearchResultItem[], type: string, icon: React.ReactNode) => {
    if (!items || items.length === 0) return null

    return (
      <CommandGroup heading={title}>
        {items.map((item) => (
          <CommandItem
            key={`${type}-${item.id}`}
            onSelect={() => handleSelect(type, item)}
            className="flex items-center"
          >
            {icon}
            <span>{item.name}</span>
            {item.category && <span className="ml-2 text-xs text-muted-foreground">{item.category}</span>}
            {item.username && <span className="ml-2 text-xs text-muted-foreground">@{item.username}</span>}
            {item.country && <span className="ml-2 text-xs text-muted-foreground">{item.country}</span>}
            {item.code && <span className="ml-2 text-xs text-muted-foreground">{item.code}</span>}
          </CommandItem>
        ))}
      </CommandGroup>
    )
  }

  return (
    <>
      {/* Search trigger */}
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

      {/* Command dialog */}
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
          {/* Loading state */}
          {isLoading && debouncedSearch.length >= 2 && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Something went wrong. Please try again.
            </div>
          )}

          {/* Search results */}
          {!isLoading && !isError && debouncedSearch.length >= 2 && (
            <>
              {!hasResults && <CommandEmpty>No results found for &quot;{debouncedSearch}&quot;</CommandEmpty>}

              {renderResultGroup("Users", results.users, "user", <User className="mr-2 h-4 w-4 shrink-0" />)}
              {renderResultGroup("Places", results.places, "place", <MapPin className="mr-2 h-4 w-4 shrink-0" />)}
              {renderResultGroup(
                "Experiences",
                results.experiences,
                "experience",
                <Compass className="mr-2 h-4 w-4 shrink-0" />,
              )}
              {renderResultGroup("Cities", results.cities, "city", <Building className="mr-2 h-4 w-4 shrink-0" />)}
              {renderResultGroup("Regions", results.regions, "region", <Globe className="mr-2 h-4 w-4 shrink-0" />)}
              {renderResultGroup(
                "Countries",
                results.countries,
                "country",
                <Globe className="mr-2 h-4 w-4 shrink-0" />,
              )}
            </>
          )}

          <CommandSeparator className={cn(debouncedSearch.length < 2 ? "mt-0" : "")} />

          {/* Suggestions */}
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
