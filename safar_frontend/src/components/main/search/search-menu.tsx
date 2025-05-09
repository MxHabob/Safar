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

interface SearchResultItem {
  id: string | number
  name: string
  category?: string
  username?: string
  country?: string
  code?: string
}

type ResultType = 'users' | 'places' | 'experiences' | 'cities' | 'regions' | 'countries'

export function CommandMenu() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch] = useDebounce(search, 300)

  const { data, isLoading } = api.useUniversalSearchQuery(
    { q: debouncedSearch, limit: 5 },
    { skip: debouncedSearch.length < 2 }
  )

  const results = data?.results || {}
  const hasResults = Object.values(results).some((items) => items.length > 0)

  const handleSelect = (type: ResultType, id: string | number) => {
    setOpen(false)
    const routes: Record<ResultType, string> = {
      users: `/users/${id}`,
      places: `/places/${id}`,
      experiences: `/experiences/${id}`,
      cities: `/cities/${id}`,
      regions: `/regions/${id}`,
      countries: `/countries/${id}`,
    }
    router.push(routes[type] || "/")
  }

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <>
      <div className="relative mx-auto max-w-4xl">
        <div className="flex items-center rounded-full bg-card shadow-lg hover:shadow-xl">
          <div className="flex-1 px-6 py-3">
            <div className="text-sm font-medium">Where</div>
            <input
              type="text"
              placeholder="Search destinations"
              className="w-full border-none p-0 text-sm focus:outline-none"
              onClick={() => setOpen(true)}
              aria-label="Open search dialog"
            />
          </div>
          <Button
            className="absolute right-2 h-12 w-12 rounded-full bg-[#34E0D8] hover:bg-[#2bc8c1]"
            onClick={() => setOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            placeholder="Search places, experiences, cities, users..."
            value={search}
            onValueChange={setSearch}
          />
        </div>

        <CommandList>
          {isLoading && debouncedSearch.length >= 2 ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : debouncedSearch.length >= 2 ? (
            <>
              {!hasResults && <CommandEmpty>No results found</CommandEmpty>}

              {Object.entries(results).map(([type, items]) => (
                items.length > 0 && (
                  <CommandGroup 
                    key={type} 
                    heading={type.charAt(0).toUpperCase() + type.slice(1)}
                  >
                    {(items as SearchResultItem[]).map((item) => (
                      <CommandItem
                        key={`${type}-${item.id}`}
                        onSelect={() => handleSelect(type as ResultType, item.id)}
                      >
                        {getIcon(type)}
                        <span>{item.name}</span>
                        {item.username && <span className="ml-2 text-xs text-muted-foreground">@{item.username}</span>}
                        {item.category && <span className="ml-2 text-xs text-muted-foreground">{item.category}</span>}
                        {item.country && <span className="ml-2 text-xs text-muted-foreground">{item.country}</span>}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              ))}
            </>
          ) : null}

          <CommandSeparator />

          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => router.push("/places/popular")}>
              <MapPin className="mr-2 h-4 w-4" />
              Popular Places
            </CommandItem>
            <CommandItem onSelect={() => router.push("/experiences/trending")}>
              <Compass className="mr-2 h-4 w-4" />
              Trending Experiences
            </CommandItem>
            <CommandItem onSelect={() => router.push("/destinations")}>
              <Globe className="mr-2 h-4 w-4" />
              Top Destinations
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

function getIcon(type: string) {
  switch (type) {
    case 'users': return <User className="mr-2 h-4 w-4" />
    case 'places': return <MapPin className="mr-2 h-4 w-4" />
    case 'experiences': return <Compass className="mr-2 h-4 w-4" />
    case 'cities': return <Building className="mr-2 h-4 w-4" />
    case 'regions':
    case 'countries': return <Globe className="mr-2 h-4 w-4" />
    default: return null
  }
}