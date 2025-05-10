/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { useGetActiveDiscountsQuery, useGetMyDiscountsQuery } from "@/core/services/api"
import type { DiscountFilters } from "./types"
import { DiscountsHeader } from "./discounts-header"
import { DiscountsFilterBar } from "./discounts-filter-bar"
import { DiscountsList } from "./discounts-list"
import { DiscountsEmptyState } from "./discounts-empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"

export const DiscountsPageContent = () => {
  const [activeTab, setActiveTab] = useState<"available" | "my-discounts">("available")
  const [filters, setFilters] = useState<DiscountFilters>({
    searchQuery: "",
    discountType: "All",
    sortBy: "expiryDate",
  })

  const { data: activeDiscountsData, isLoading: isLoadingActive } = useGetActiveDiscountsQuery({})

  const { data: myDiscountsData, isLoading: isLoadingMy } = useGetMyDiscountsQuery({})

  const activeDiscounts = activeDiscountsData?.results || []
  const myDiscounts = myDiscountsData?.results || []

  const handleFiltersChange = (newFilters: Partial<DiscountFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const filterDiscounts = (discounts: any[]) => {
    return discounts.filter((discount) => {
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase()
        if (
          !discount.code.toLowerCase().includes(searchLower) &&
          !(discount.description && discount.description.toLowerCase().includes(searchLower))
        ) {
          return false
        }
      }

      if (filters.discountType !== "All") {
        if (filters.discountType === "Percentage" && discount.discount_type !== "Percentage") return false
        if (filters.discountType === "Fixed" && discount.discount_type !== "Fixed") return false
      }

      return true
    })
  }

  const sortDiscounts = (discounts: any[]) => {
    return [...discounts].sort((a, b) => {
      if (filters.sortBy === "expiryDate") {
        return new Date(a.valid_to).getTime() - new Date(b.valid_to).getTime()
      } else if (filters.sortBy === "highestValue") {
        if (a.discount_type === "Percentage" && b.discount_type === "Percentage") {
          return b.amount - a.amount
        } else if (a.discount_type === "Fixed" && b.discount_type === "Fixed") {
          return b.amount - a.amount
        } else if (a.discount_type === "Percentage") {
          return -1
        } else {
          return 1
        }
      } else if (filters.sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      return 0
    })
  }

  const filteredActiveDiscounts = filterDiscounts(activeDiscounts)
  const sortedActiveDiscounts = sortDiscounts(filteredActiveDiscounts)

  const filteredMyDiscounts = filterDiscounts(myDiscounts)
  const sortedMyDiscounts = sortDiscounts(filteredMyDiscounts)

//   const isLoading = activeTab === "available" ? isLoadingActive : isLoadingMy
//   const currentDiscounts = activeTab === "available" ? sortedActiveDiscounts : sortedMyDiscounts
  const totalDiscounts = activeTab === "available" ? activeDiscounts.length : myDiscounts.length


  const discountCounts = {
    percentage:
      activeTab === "available"
        ? activeDiscounts.filter((d) => d.discount_type === "Percentage").length
        : myDiscounts.filter((d) => d.discount_type === "Percentage").length,
    fixed:
      activeTab === "available"
        ? activeDiscounts.filter((d) => d.discount_type === "Fixed").length
        : myDiscounts.filter((d) => d.discount_type === "Fixed").length,
    total: totalDiscounts,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DiscountsHeader discountCounts={discountCounts} activeTab={activeTab} />

      <Tabs
        defaultValue="available"
        className="mt-6"
        onValueChange={(value) => setActiveTab(value as "available" | "my-discounts")}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="available">Available Discounts</TabsTrigger>
          <TabsTrigger value="my-discounts">My Discounts</TabsTrigger>
        </TabsList>

        <DiscountsFilterBar filters={filters} onFiltersChange={handleFiltersChange} discountCounts={discountCounts} />

        <TabsContent value="available" className="mt-6">
          {isLoadingActive ? (
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg"/>
            </div>
          ) : sortedActiveDiscounts.length > 0 ? (
            <DiscountsList discounts={sortedActiveDiscounts} showAppliedStatus={false} />
          ) : (
            <DiscountsEmptyState
              hasDiscounts={activeDiscounts.length > 0}
              activeFilter={filters.discountType}
              type="available"
            />
          )}
        </TabsContent>

        <TabsContent value="my-discounts" className="mt-6">
          {isLoadingMy ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : sortedMyDiscounts.length > 0 ? (
            <DiscountsList discounts={sortedMyDiscounts} showAppliedStatus={true} />
          ) : (
            <DiscountsEmptyState
              hasDiscounts={myDiscounts.length > 0}
              activeFilter={filters.discountType}
              type="my-discounts"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
