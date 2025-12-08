"use client";

import { LoyaltyStatusCard } from "./components/loyalty-status-card";
import { RedemptionOptions } from "./components/redemption-options";
import { LoyaltyHistory } from "./components/loyalty-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Gift, History } from "lucide-react";

export function LoyaltyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">برنامج الولاء</h1>
        <p className="text-muted-foreground">
          كسب واستبدل النقاط للحصول على مكافآت حصرية
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Status Card - Takes full width on mobile, 1/3 on desktop */}
        <div className="lg:col-span-1">
          <LoyaltyStatusCard />
        </div>

        {/* Quick Actions - Takes 2/3 on desktop */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="redeem" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="redeem" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                استبدال النقاط
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                السجل
              </TabsTrigger>
            </TabsList>
            <TabsContent value="redeem" className="mt-6">
              <RedemptionOptions />
            </TabsContent>
            <TabsContent value="history" className="mt-6">
              <LoyaltyHistory limit={20} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Coins className="h-5 w-5" />
          كيف يعمل برنامج الولاء؟
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2">1. كسب النقاط</h3>
            <p className="text-sm text-muted-foreground">
              احصل على نقاط عند إتمام الحجوزات. كل دولار ينفق = نقاط حسب مستواك
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. ترقية المستوى</h3>
            <p className="text-sm text-muted-foreground">
              كلما زادت نقاطك، ترتقي إلى مستويات أعلى مع مكافآت أفضل
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. استبدال النقاط</h3>
            <p className="text-sm text-muted-foreground">
              استبدل نقاطك للحصول على خصومات حصرية على حجوزاتك القادمة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

