"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getPortfolioByUserId, 
  createPortfolio, 
  updatePortfolio,
  isSlugAvailable,
  getUserByEmail 
} from "@/lib/storage";
import { 
  Portfolio, 
  createEmptyPortfolio, 
  PersonalInfo,
  Education,
  Experience,
  Skill,
  Role,
  Certification,
  Project,
  Achievement,
  Language
} from "@/types/portfolio";
import { generateSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Not authenticated");
  }
  
  const user = await getUserByEmail(session.user.email);
  if (!user) {
    throw new Error("User not found");
  }
  
  return user;
}

export async function getMyPortfolio(): Promise<Portfolio | null> {
  const user = await getAuthenticatedUser();
  return await getPortfolioByUserId(user.id);
}

export async function initializePortfolio(): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  
  // Check if portfolio already exists
  let portfolio = await getPortfolioByUserId(user.id);
  if (portfolio) {
    return portfolio;
  }
  
  // Generate unique slug from username
  let slug = generateSlug(user.username || "portfolio");
  let counter = 1;
  while (!(await isSlugAvailable(slug))) {
    slug = `${generateSlug(user.username || "portfolio")}-${counter}`;
    counter++;
  }
  
  // Create new portfolio with user data
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  portfolio = createEmptyPortfolio(user.id, slug);
  portfolio.personalInfo.fullName = fullName;
  portfolio.personalInfo.email = user.email;
  portfolio.personalInfo.phone = user.phone || "";
  portfolio.personalInfo.whatsapp = user.whatsapp || "";
  portfolio.personalInfo.profileImage = user.image || "";
  
  // Add social links from user profile
  const socialLinks = [];
  if (user.githubUrl) {
    socialLinks.push({ id: "github", platform: "github" as const, url: user.githubUrl });
  }
  if (user.linkedinUrl) {
    socialLinks.push({ id: "linkedin", platform: "linkedin" as const, url: user.linkedinUrl });
  }
  portfolio.personalInfo.socialLinks = socialLinks;
  
  await createPortfolio(portfolio);
  revalidatePath("/dashboard");
  
  return portfolio;
}

export async function updatePersonalInfo(personalInfo: PersonalInfo): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  
  const portfolio = await updatePortfolio(user.id, { personalInfo });
  if (!portfolio) {
    throw new Error("Portfolio not found");
  }
  
  revalidatePath("/dashboard");
  revalidatePath(`/p/${portfolio.slug}`);
  
  return portfolio;
}

export async function updatePortfolioSlug(newSlug: string): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const slug = generateSlug(newSlug);
  
  if (!(await isSlugAvailable(slug, user.id))) {
    throw new Error("This URL is already taken");
  }
  
  const portfolio = await updatePortfolio(user.id, { slug });
  if (!portfolio) {
    throw new Error("Portfolio not found");
  }
  
  revalidatePath("/dashboard");
  
  return portfolio;
}

export async function togglePortfolioVisibility(): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const portfolio = await updatePortfolio(user.id, { 
    isPublic: !currentPortfolio.isPublic 
  });
  
  if (!portfolio) {
    throw new Error("Failed to update portfolio");
  }
  
  revalidatePath("/dashboard");
  revalidatePath(`/p/${portfolio.slug}`);
  
  return portfolio;
}

// Education actions
export async function addEducation(education: Omit<Education, "id">): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const newEducation: Education = {
    ...education,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
  };
  
  const portfolio = await updatePortfolio(user.id, {
    education: [...currentPortfolio.education, newEducation],
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}

export async function updateEducation(education: Education): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const portfolio = await updatePortfolio(user.id, {
    education: currentPortfolio.education.map(e => 
      e.id === education.id ? education : e
    ),
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}

export async function deleteEducation(id: string): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const portfolio = await updatePortfolio(user.id, {
    education: currentPortfolio.education.filter(e => e.id !== id),
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}

// Experience actions
export async function addExperience(experience: Omit<Experience, "id">): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const newExperience: Experience = {
    ...experience,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
  };
  
  const portfolio = await updatePortfolio(user.id, {
    experience: [...currentPortfolio.experience, newExperience],
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}

export async function updateExperience(experience: Experience): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const portfolio = await updatePortfolio(user.id, {
    experience: currentPortfolio.experience.map(e => 
      e.id === experience.id ? experience : e
    ),
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}

export async function deleteExperience(id: string): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const portfolio = await updatePortfolio(user.id, {
    experience: currentPortfolio.experience.filter(e => e.id !== id),
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}

// Skills actions
export async function addSkill(skill: Omit<Skill, "id">): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const newSkill: Skill = {
    ...skill,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
  };
  
  const portfolio = await updatePortfolio(user.id, {
    skills: [...currentPortfolio.skills, newSkill],
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}

export async function deleteSkill(id: string): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const portfolio = await updatePortfolio(user.id, {
    skills: currentPortfolio.skills.filter(s => s.id !== id),
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}

// Roles actions
export async function addRole(role: Omit<Role, "id">): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const newRole: Role = {
    ...role,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
  };
  
  const portfolio = await updatePortfolio(user.id, {
    roles: [...currentPortfolio.roles, newRole],
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}

export async function deleteRole(id: string): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const portfolio = await updatePortfolio(user.id, {
    roles: currentPortfolio.roles.filter(r => r.id !== id),
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}

// Certification actions
export async function addCertification(cert: Omit<Certification, "id">): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const newCert: Certification = {
    ...cert,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
  };
  
  const portfolio = await updatePortfolio(user.id, {
    certifications: [...currentPortfolio.certifications, newCert],
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}

export async function deleteCertification(id: string): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const portfolio = await updatePortfolio(user.id, {
    certifications: currentPortfolio.certifications.filter(c => c.id !== id),
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}

// Project actions
export async function addProject(project: Omit<Project, "id">): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const newProject: Project = {
    ...project,
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
  };
  
  const portfolio = await updatePortfolio(user.id, {
    projects: [...currentPortfolio.projects, newProject],
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}

export async function updateProject(project: Project): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const portfolio = await updatePortfolio(user.id, {
    projects: currentPortfolio.projects.map(p => 
      p.id === project.id ? project : p
    ),
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}

export async function deleteProject(id: string): Promise<Portfolio> {
  const user = await getAuthenticatedUser();
  const currentPortfolio = await getPortfolioByUserId(user.id);
  
  if (!currentPortfolio) {
    throw new Error("Portfolio not found");
  }
  
  const portfolio = await updatePortfolio(user.id, {
    projects: currentPortfolio.projects.filter(p => p.id !== id),
  });
  
  revalidatePath("/dashboard");
  return portfolio!;
}
