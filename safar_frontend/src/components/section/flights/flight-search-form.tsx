"use client"

import { useState } from "react"
import { useFormState } from "react-dom"
import { searchFlights, searchAirports } from "@/app/actions/flight-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Plane, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-mobile"

interface Airport {
  id: string
  name: string
  city: string
  country: string
  iataCode: string
}

const initialState = {
  error: null,
}

export default function FlightSearchForm() {
  const [state, formAction] = useFormState(searchFlights, initialState)
  const [tripType, setTripType] = useState<"oneWay" | "roundTrip">("roundTrip")
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
  )
  const [returnDate, setReturnDate] = useState<Date | undefined>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
  )

  // Airport search state
  const [originSearch, setOriginSearch] = useState("")
  const [destinationSearch, setDestinationSearch] = useState("")
  const [originAirports, setOriginAirports] = useState<Airport[]>([])
  const [destinationAirports, setDestinationAirports] = useState<Airport[]>([])
  const [selectedOrigin, setSelectedOrigin] = useState<Airport | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<Airport | null>(null)
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false)
  const [isSearchingDestination, setIsSearchingDestination] = useState(false)

  const debouncedOriginSearch = useDebounce(originSearch, 300)
  const debouncedDestinationSearch = useDebounce(destinationSearch, 300)

  // Search for airports when the debounced search term changes
  const handleOriginSearch = async (value: string) => {
    setOriginSearch(value)

    if (debouncedOriginSearch.length < 2) return

    setIsSearchingOrigin(true)
    try {
      const result = await searchAirports(debouncedOriginSearch)
      if (result.data) {
        setOriginAirports(result.data)
      }
    } catch (error) {
      console.error("Error searching airports:", error)
    } finally {
      setIsSearchingOrigin(false)
    }
  }

  const handleDestinationSearch = async (value: string) => {
    setDestinationSearch(value)

    if (debouncedDestinationSearch.length < 2) return

    setIsSearchingDestination(true)
    try {
      const result = await searchAirports(debouncedDestinationSearch)
      if (result.data) {
        setDestinationAirports(result.data)
      }
    } catch (error) {
      console.error("Error searching airports:", error)
    } finally {
      setIsSearchingDestination(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Flights</CardTitle>
        <CardDescription>Find the best flights for your journey</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="roundTrip"
          className="w-full"
          onValueChange={(value) => setTripType(value as "oneWay" | "roundTrip")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="roundTrip">Round Trip</TabsTrigger>
            <TabsTrigger value="oneWay">One Way</TabsTrigger>
          </TabsList>

          <form action={formAction} className="mt-6 space-y-6">
            {state.error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{state.error}</div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {/* Origin Airport */}
              <div className="space-y-2">
                <Label htmlFor="origin">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {selectedOrigin ? selectedOrigin.name : "Search for airports..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search airports..."
                        value={originSearch}
                        onValueChange={handleOriginSearch}
                      />
                      <CommandList>
                        {isSearchingOrigin ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>No airports found.</CommandEmpty>
                            <CommandGroup>
                              {originAirports.map((airport) => (
                                <CommandItem
                                  key={airport.id}
                                  value={airport.name}
                                  onSelect={() => {
                                    setSelectedOrigin(airport)
                                    setOriginSearch("")
                                  }}
                                >
                                  <Plane className="mr-2 h-4 w-4" />
                                  <span>{airport.name}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <input type="hidden" name="origin" value={selectedOrigin?.iataCode || ""} required />
              </div>

              {/* Destination Airport */}
              <div className="space-y-2">
                <Label htmlFor="destination">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {selectedDestination ? selectedDestination.name : "Search for airports..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search airports..."
                        value={destinationSearch}
                        onValueChange={handleDestinationSearch}
                      />
                      <CommandList>
                        {isSearchingDestination ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>No airports found.</CommandEmpty>
                            <CommandGroup>
                              {destinationAirports.map((airport) => (
                                <CommandItem
                                  key={airport.id}
                                  value={airport.name}
                                  onSelect={() => {
                                    setSelectedDestination(airport)
                                    setDestinationSearch("")
                                  }}
                                >
                                  <Plane className="mr-2 h-4 w-4" />
                                  <span>{airport.name}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <input type="hidden" name="destination" value={selectedDestination?.iataCode || ""} required />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Departure Date */}
              <div className="space-y-2">
                <Label htmlFor="departureDate">Departure Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !departureDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate ? format(departureDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={departureDate}
                      onSelect={setDepartureDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <input
                  type="hidden"
                  name="departureDate"
                  value={departureDate ? format(departureDate, "yyyy-MM-dd") : ""}
                  required
                />
              </div>

              {/* Return Date */}
              {tripType === "roundTrip" && (
                <div className="space-y-2">
                  <Label htmlFor="returnDate">Return Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !returnDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={setReturnDate}
                        initialFocus
                        disabled={(date) => (departureDate ? date < departureDate : date < new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                  <input
                    type="hidden"
                    name="returnDate"
                    value={returnDate && tripType === "roundTrip" ? format(returnDate, "yyyy-MM-dd") : ""}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Passengers */}
              <div className="space-y-2">
                <Label htmlFor="adults">Adults</Label>
                <Select name="adults" defaultValue="1">
                  <SelectTrigger>
                    <SelectValue placeholder="Adults" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "Adult" : "Adults"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="children">Children (2-11)</Label>
                <Select name="children" defaultValue="0">
                  <SelectTrigger>
                    <SelectValue placeholder="Children" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "Child" : "Children"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="infants">Infants (0-2)</Label>
                <Select name="infants" defaultValue="0">
                  <SelectTrigger>
                    <SelectValue placeholder="Infants" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "Infant" : "Infants"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="travelClass">Cabin Class</Label>
              <RadioGroup defaultValue="ECONOMY" name="travelClass" className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ECONOMY" id="economy" />
                  <Label htmlFor="economy">Economy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PREMIUM_ECONOMY" id="premium" />
                  <Label htmlFor="premium">Premium Economy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BUSINESS" id="business" />
                  <Label htmlFor="business">Business</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="FIRST" id="first" />
                  <Label htmlFor="first">First Class</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="directFlights" name="directFlights" />
              <Label htmlFor="directFlights">Direct flights only</Label>
            </div>

            <Button type="submit" className="w-full">
              Search Flights
            </Button>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  )
}
