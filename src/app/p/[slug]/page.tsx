import { notFound } from "next/navigation";
import { getPortfolioBySlug } from "@/lib/storage";
import { PublicPortfolio } from "@/components/portfolio/public-portfolio";
import type { Metadata } from "next";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Don't require public for metadata
  const portfolio = await getPortfolioBySlug(params.slug, false);
  
  if (!portfolio) {
    return {
      title: "Portfolio Not Found",
    };
  }

  return {
    title: `${portfolio.personalInfo.fullName} - Portfolio`,
    description: portfolio.personalInfo.bio || `${portfolio.personalInfo.fullName}'s professional portfolio`,
    openGraph: {
      title: `${portfolio.personalInfo.fullName} - Portfolio`,
      description: portfolio.personalInfo.bio || `${portfolio.personalInfo.fullName}'s professional portfolio`,
      type: "profile",
    },
  };
}

export default async function PortfolioPage({ params }: PageProps) {
  // Allow viewing any portfolio (public or private) - user can share their link
  const portfolio = await getPortfolioBySlug(params.slug, false);

  if (!portfolio) {
    notFound();
  }

  return <PublicPortfolio portfolio={portfolio} />;
}
