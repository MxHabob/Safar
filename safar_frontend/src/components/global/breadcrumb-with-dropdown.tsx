"use client"

import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BreadcrumbItemProps {
  label: string
  href?: string
}

interface BreadcrumbWithDropdownProps {
  items: BreadcrumbItemProps[]
  dropdownItems?: BreadcrumbItemProps[]
  dropdownPosition?: number
  className?: string
}

export function BreadcrumbWithDropdown({
  items,
  dropdownItems = [],
  dropdownPosition = 1,
  className,
}: BreadcrumbWithDropdownProps) {
  const position = Math.min(Math.max(0, dropdownPosition), items.length)

  const beforeItems = items.slice(0, position)
  const afterItems = items.slice(position)

  return (
    <div className={className}>
      <Breadcrumb>
        <BreadcrumbList>
          {beforeItems.map((item, index) => (
            <BreadcrumbItem key={`before-${index}`}>
              {item.href ? (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
              {index < beforeItems.length - 0 && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          ))}

          {dropdownItems.length > 0 && (
            <>
              {beforeItems.length > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 text-sm">
                    <BreadcrumbEllipsis />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {dropdownItems.map((item, index) => (
                      <DropdownMenuItem key={`dropdown-${index}`} asChild>
                        {item.href ? (
                          <Link href={item.href}>{item.label}</Link>
                        ) : (
                          <span>{item.label}</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}

          {afterItems.map((item, index) => (
            <BreadcrumbItem key={`after-${index}`}>
              {item.href ? (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
              {index < afterItems.length - 1 && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
