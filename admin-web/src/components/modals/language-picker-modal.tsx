"use client"

import * as React from "react"
import { Search, Check } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useModal } from "@/lib/stores/modal-store"
import { cn } from "@/lib/utils"

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
]

export function LanguagePickerModal() {
  const { isOpen, type, data, onClose } = useModal()
  const open = isOpen && type === "languagePicker"

  const [searchQuery, setSearchQuery] = React.useState("")
  const selectedLanguage = (data?.language as string | undefined) || "en"
  const onSelectLanguage = data?.onLanguageSelect as ((code: string) => void) | undefined

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (code: string) => {
    if (onSelectLanguage) onSelectLanguage(code)
    onClose()
  }

  if (!open) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (!isOpen ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md w-[95vw] max-w-[95vw] mx-2">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Search className="h-4 w-4" />
            </div>
            <DialogTitle>Select Language</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl h-9 text-sm"
            />
          </div>

          <ScrollArea className="h-[60vh] sm:h-[400px] pr-4">
            <div className="space-y-1">
              {filteredLanguages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={selectedLanguage === lang.code ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-between py-2 rounded-xl transition-all duration-200",
                    selectedLanguage === lang.code 
                      ? "bg-primary/10 hover:bg-primary/15 border border-primary/20" 
                      : "hover:bg-accent/50"
                  )}
                  onClick={() => handleSelect(lang.code)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-left flex-1 min-w-0">
                    <span className="font-medium text-xs sm:text-sm truncate">{lang.name}</span>
                    <span className="text-muted-foreground text-xs truncate">{lang.nativeName}</span>
                  </div>
                  {selectedLanguage === lang.code && <Check className="h-3.5 w-3.5 shrink-0 ml-2 text-primary" />}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}