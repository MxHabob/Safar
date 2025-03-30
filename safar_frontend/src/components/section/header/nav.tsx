import Link from "next/link"
import { Globe, Menu } from "lucide-react"
import { Button } from "../../ui/button"
import { UserAvatar } from "@/components/global/user-avatar"
import { ModeToggle } from "@/components/global/mode-toggle"

export function Nav() {
  return (
    <div className="flex items-center justify-between py-4">
    <div className="flex items-center">
      <Link href="/" className="">
        <span className="ml-2 text-lg font-bold">Safar</span>
      </Link>
    </div>
    <nav className="hidden md:block">
      <ul className="flex space-x-6">
        <li>
          <Link href="#" className="font-mediumpb-2">
            Homes
          </Link>
        </li>
        <li>
          <Link href="#" className="font-medium">
            Experiences
          </Link>
        </li>
      </ul>
    </nav>
    <div className="flex items-center space-x-4">
      <ModeToggle/>
      <Button className="rounded-full p-2 ">
        <Globe className="h-5 w-5" />
      </Button>
      <Button className="flex items-center rounded-full p-2 ">
        <Menu className="h-5 w-5 mr-2" />
        <div>
          <UserAvatar className="h-5 w-5 " />
        </div>
      </Button>
    </div>
  </div>
  )
}

