import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server/session";

export default async function HomePage() {
    const user = await getCurrentUser();
    if (!user) {
        return redirect("/login?redirect=/h");
    }
    if (user.role !== "host" && user.role !== "agency") {
        return redirect("/");
    };
    return redirect("/h/dashboard");
}