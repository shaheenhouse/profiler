import { notFound } from "next/navigation";
import { getPortfolioBySlug } from "@/lib/storage";
import { PublicPortfolio } from "@/components/portfolio/public-portfolio";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXTAUTH_URL || 'https://profiler.app';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const portfolio = await getPortfolioBySlug(slug, false);
  
  if (!portfolio) {
    return {
      title: "Portfolio Not Found",
    };
  }

  const fullName = portfolio.personalInfo.fullName || slug;
  const title = portfolio.personalInfo.title || 'Professional';
  const bio = portfolio.personalInfo.bio || `${fullName}'s professional portfolio and resume`;
  const profileImage = portfolio.personalInfo.profileImage;
  const url = `${siteUrl}/p/${slug}`;

  // Build skills string for keywords
  const skillNames = portfolio.skills.slice(0, 15).map(s => s.name);

  return {
    title: `${fullName} - ${title}`,
    description: bio.slice(0, 160),
    keywords: [
      fullName,
      title,
      'portfolio',
      'resume',
      ...skillNames,
    ],
    authors: [{ name: fullName }],
    openGraph: {
      type: "profile",
      locale: "en_US",
      url,
      title: `${fullName} - ${title}`,
      description: bio.slice(0, 160),
      siteName: "Profiler",
      images: profileImage ? [
        {
          url: profileImage,
          width: 400,
          height: 400,
          alt: fullName,
        },
      ] : [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${fullName} - Portfolio`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${fullName} - ${title}`,
      description: bio.slice(0, 160),
      images: profileImage ? [profileImage] : ["/og-image.png"],
    },
    alternates: {
      canonical: url,
    },
    robots: portfolio.isPublic ? {
      index: true,
      follow: true,
    } : {
      index: false,
      follow: false,
    },
  };
}

export default async function PortfolioPage({ params }: PageProps) {
  const { slug } = await params;
  const portfolio = await getPortfolioBySlug(slug, false);

  if (!portfolio) {
    notFound();
  }

  const fullName = portfolio.personalInfo.fullName || slug;
  const title = portfolio.personalInfo.title || 'Professional';
  const bio = portfolio.personalInfo.bio || '';
  const url = `${siteUrl}/p/${slug}`;

  // JSON-LD structured data for the person
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: fullName,
    jobTitle: title,
    description: bio,
    url,
    ...(portfolio.personalInfo.email && { email: `mailto:${portfolio.personalInfo.email}` }),
    ...(portfolio.personalInfo.profileImage && { image: portfolio.personalInfo.profileImage }),
    ...(portfolio.personalInfo.location && {
      address: {
        "@type": "PostalAddress",
        addressLocality: portfolio.personalInfo.location,
      },
    }),
    sameAs: portfolio.personalInfo.socialLinks
      ?.filter(sl => sl.url)
      .map(sl => sl.url) || [],
    knowsAbout: portfolio.skills.map(s => s.name),
    alumniOf: portfolio.education.map(e => ({
      "@type": "EducationalOrganization",
      name: e.institution,
    })),
    worksFor: portfolio.experience
      .filter(e => e.current)
      .map(e => ({
        "@type": "Organization",
        name: e.company,
      }))[0],
  };

  // JSON-LD for ProfilePage
  const profilePageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${fullName} - Portfolio`,
    description: bio,
    url,
    mainEntity: {
      "@type": "Person",
      name: fullName,
    },
    dateModified: portfolio.updatedAt,
    dateCreated: portfolio.createdAt,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd) }}
      />
      <PublicPortfolio portfolio={portfolio} />
    </>
  );
}
