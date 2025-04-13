"use client"

import { MSearch } from "./Serch"
import { Nav } from "./nav"

export function Header() {

  return (
    <header className="mx-4">
    <Nav/>
    <MSearch/>
    </header>
  )
}