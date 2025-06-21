import { getIndustryInsights } from "@/actions/dashboard";
import DashboardView from "./_component/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Check if user is onboarded
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  // Fetch insights
  const insights = await getIndustryInsights();

  // Safety check in case insights failed or are undefined/null
  if (!insights) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-xl font-semibold text-red-500">
          Failed to load industry insights.
        </h2>
        <p className="text-muted-foreground mt-2">
          Please try refreshing or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <DashboardView insights={insights} />
    </div>
  );
}
