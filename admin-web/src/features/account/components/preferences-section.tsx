"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetCurrentUserInfoApiV1UsersMeGet, useUpdateCurrentUserApiV1UsersMePutMutation } from "@/generated/hooks/users";
import { GetCurrentUserInfoApiV1UsersMeGetResponse } from "@/generated/schemas";
import { useModal } from "@/lib/stores/modal-store";
import { Globe, Bell, Moon, Sun, Languages } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";

interface PreferencesSectionProps {
  initialUser?: GetCurrentUserInfoApiV1UsersMeGetResponse;
}

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
];

const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "SAR", name: "Saudi Riyal", symbol: "ر.س" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
];

export function PreferencesSection({ initialUser }: PreferencesSectionProps) {
  const { data: user } = useGetCurrentUserInfoApiV1UsersMeGet({
    initialData: initialUser,
  });

  const { onOpen } = useModal();
  const [language, setLanguage] = useState(user?.language || "en");
  const [currency, setCurrency] = useState(user?.currency || "USD");

  const updateMutation = useUpdateCurrentUserApiV1UsersMePutMutation({
    showToast: true,
    onSuccess: () => {
      toast.success("Preferences updated successfully");
    },
  });

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    updateMutation.mutate({
      language: newLanguage,
      locale: newLanguage,
    });
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    updateMutation.mutate({
      currency: newCurrency,
    });
  };

  const handleOpenLanguagePicker = () => {
    onOpen("languagePicker", {
      language: language,
      onLanguageSelect: handleLanguageChange,
    });
  };

  const selectedLanguage = languages.find((l) => l.code === language) || languages[0];
  const selectedCurrency = currencies.find((c) => c.code === currency) || currencies[0];

  return (
    <div className="space-y-6">
      {/* Language Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <Label className="font-semibold">Language</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose your preferred language for the interface
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[180px] rounded-xl h-9">
                <SelectValue>
                  {selectedLanguage.nativeName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleOpenLanguagePicker}
              variant="outline"
              size="icon"
              className="rounded-xl h-9 w-9"
              title="Browse all languages"
            >
              <Globe className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Currency Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 text-muted-foreground">$</span>
              <Label className="font-semibold">Currency</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Select your preferred currency for displaying prices
            </p>
          </div>
          <Select value={currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-[180px] rounded-xl h-9">
              <SelectValue>
                {selectedCurrency.symbol} {selectedCurrency.code}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {currencies.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.name} ({curr.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Theme Section (Placeholder) */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-muted-foreground" />
              <Label className="font-semibold">Theme</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Customize the appearance of the interface
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Managed by system theme toggle
          </div>
        </div>
      </div>

      {/* Notifications Section (Placeholder) */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label className="font-semibold">Notifications</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage your notification preferences
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl h-9"
            onClick={() => toast.info("Notification settings coming soon")}
          >
            Configure
          </Button>
        </div>
      </div>
    </div>
  );
}

