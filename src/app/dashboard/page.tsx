import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPortfolioByUserId, getUserByEmail } from "@/lib/storage";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { initializePortfolio } from "@/actions/portfolio";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  const user = await getUserByEmail(session.user.email);
  if (!user) {
    redirect("/auth/signin");
  }

  let portfolio = await getPortfolioByUserId(user.id);
  
  // Initialize portfolio if it doesn't exist
  if (!portfolio) {
    portfolio = await initializePortfolio();
  }

  return <DashboardContent portfolio={portfolio} user={user} />;
}
