import Link from "next/link"
import { UserAvatar } from "@/components/global/user-avatar"
import { ModeToggle } from "@/components/global/mode-toggle"
import NotificationCenter from "@/components/global/notification-center"

export function Nav() {
  return (
    <div className="flex items-center justify-between px-6 py-4 ">
    <div className="flex items-center">
      <Link href="/" className="">
        <span className="ml-2 text-lg font-bold">Safar</span>
      </Link>
    </div>
    <nav className="hidden md:block ">
      <ul className="flex space-x-6">
        <li>
          <Link href="/" className="font-medium">
            Homes
          </Link>
        </li>
        <li>
          <Link href="/flights" className="font-medium">
          Flight
          </Link>
        </li>
      </ul>
    </nav>
    <div className="flex items-center space-x-4">
      <ModeToggle/>
      <NotificationCenter/>
      <div className="flex items-center rounded-full ">
          <UserAvatar className=" w-9 h-9" />
      </div>
    </div>
  </div>
  )
}

