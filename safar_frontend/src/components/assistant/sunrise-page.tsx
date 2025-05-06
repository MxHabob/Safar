"use client"

import { useState } from "react"
import Image from "next/image"
import { useGetPersonalizedBoxMutation, useGetCountriesQuery } from "@/core/services/api"

import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ListSlider } from "../global/list-slider"

export const SunrisePage = () => {
  const [preference, setPreference] = useState("")
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  
  const { data: countriesData, isLoading: isLoadingCountries } = useGetCountriesQuery({ page_size: 100 })
  const [generateBox] = useGetPersonalizedBoxMutation()

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreference(e.target.value)
  }

  const handleCountrySelect = (countryName: string) => {
    setSelectedCountry(countryName)

    if (preference) {
      handleGenerateBox(countryName)
    }
  }

  const handleGenerateBox = async (country: string) => {
    try {
      const result = await generateBox({
        destination_id: country,
        destination_type: "country",
      }).unwrap()
      
      toast.success("Preferences saved!", {
        description: `Your personalized recommendations for ${country} are ready.`,
      })
      
      console.log("Generated box:", result)
      
    } catch (error) {
      toast.error("Something went wrong", {
        description: `Could not save your preferences. ${error}`,
      })
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <div className="mb-6 flex items-center gap-2">
          <div className="bg-teal-400 rounded-full p-2">
            <Image 
              src="/placeholder.svg?height=24&width=24" 
              alt="Sunrise Logo" 
              width={24} 
              height={24} 
              className="text-white"
            />
          </div>
          <h1 className="text-xl font-medium">Hi, I&apos;m Sunrise.</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Specify your destination and I&apos;ll show what&apos;s most relevant for you.
        </p>
        <Input
          className="w-full bg-gray-200 border-0 mb-6 h-12 rounded-full"
          placeholder="What are you looking for?"
          value={preference}
          onChange={handlePreferenceChange}
        />
        
        {isLoadingCountries ? (
          <div className="w-full h-10 bg-gray-200 animate-pulse rounded-full"></div>
        ) : (
          <ListSlider 
            items={countriesData?.results || []}
            selected={selectedCountry || undefined}
            route={false}
            overlay={true}
            onSlideClick={(item) => handleCountrySelect(item.name)}
          />
        )}
      </div>
    </div>
  )
}
