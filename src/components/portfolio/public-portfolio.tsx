"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from "framer-motion";
import { Portfolio } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticlesBackground } from "@/components/particles-background";
import { ResumeModal } from "@/components/resume/resume-modal";
import { formatDate, calculateDuration } from "@/lib/utils";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Github, 
  Linkedin, 
  Globe, 
  ExternalLink,
  FileText,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  FolderGit2,
  Sparkles,
  ChevronDown,
  User,
  Menu,
  X
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

interface PublicPortfolioProps {
  portfolio: Portfolio;
}

// Navigation items
const navItems = [
  { id: "about", label: "About", icon: User },
  { id: "roles", label: "Roles", icon: Code },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "skills", label: "Skills", icon: Code },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "contact", label: "Contact", icon: Mail },
];

const levelColors = {
  expert: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300",
  proficient: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300",
  intermediate: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300",
  beginner: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/50 dark:text-gray-300",
};

// Animated Card with 3D Tilt Effect
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateXValue = ((y - centerY) / centerY) * -10;
    const rotateYValue = ((x - centerX) / centerX) * 10;
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Interactive Skills Orbit
function SkillsOrbit({ skills }: { skills: { id: string; name: string; level: string }[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    if (!autoRotate || isDragging) return;
    const interval = setInterval(() => {
      setRotation(prev => prev + 0.5);
    }, 50);
    return () => clearInterval(interval);
  }, [autoRotate, isDragging]);

  const handleMouseDown = () => {
    setIsDragging(true);
    setAutoRotate(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setAutoRotate(true), 3000);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setRotation(prev => prev + e.movementX * 0.5);
  };

  const radius = 180;
  const skillCount = skills.length;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[400px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {/* Center glow */}
      <div className="absolute w-32 h-32 rounded-full bg-primary/20 blur-xl animate-pulse" />
      <div className="absolute w-20 h-20 rounded-full bg-primary/30 blur-md" />
      
      {/* Skills orbiting */}
      {skills.map((skill, index) => {
        const angle = (index / skillCount) * 360 + rotation;
        const radian = (angle * Math.PI) / 180;
        const x = Math.cos(radian) * radius;
        const y = Math.sin(radian) * radius * 0.4; // Ellipse effect
        const z = Math.sin(radian) * 50;
        const scale = (z + 50) / 100 * 0.5 + 0.5;
        const opacity = (z + 50) / 100 * 0.5 + 0.5;

        return (
          <motion.div
            key={skill.id}
            className={`absolute px-4 py-2 rounded-full border-2 font-medium cursor-pointer
              ${levelColors[skill.level as keyof typeof levelColors]}
              hover:scale-110 transition-transform
            `}
            style={{
              x,
              y,
              scale,
              opacity,
              zIndex: Math.round(z + 50),
            }}
            whileHover={{ scale: scale * 1.2 }}
            whileTap={{ scale: scale * 0.9 }}
          >
            {skill.name}
          </motion.div>
        );
      })}

      {/* Instruction text */}
      <p className="absolute bottom-0 text-sm text-muted-foreground">
        Drag to rotate • Click to interact
      </p>
    </div>
  );
}

// Animated Section Wrapper
function AnimatedSection({ 
  id, 
  children, 
  className = "",
  delay = 0 
}: { 
  id: string; 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// Role Card with hover animation
function RoleCard({ role, index }: { role: { id: string; title: string; level: string }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
      whileHover={{ 
        scale: 1.05, 
        y: -5,
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.3)"
      }}
      whileTap={{ scale: 0.95 }}
      className={`rounded-2xl border-2 px-6 py-4 cursor-pointer backdrop-blur-sm
        ${levelColors[role.level as keyof typeof levelColors]}
        transition-colors duration-300
      `}
    >
      <motion.span 
        className="font-bold text-lg block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.1 + 0.2 }}
      >
        {role.title}
      </motion.span>
      <span className="text-sm capitalize opacity-80 flex items-center gap-1 mt-1">
        <Sparkles className="h-3 w-3" />
        {role.level}
      </span>
    </motion.div>
  );
}

// Experience Card with timeline
function ExperienceCard({ exp, index }: { exp: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.6 }}
    >
      <TiltCard>
        <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-purple-500 to-pink-500" />
          <CardContent className="p-6 pl-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <motion.h3 
                  className="text-xl font-bold group-hover:text-primary transition-colors"
                  whileHover={{ x: 5 }}
                >
                  {exp.title}
                </motion.h3>
                <p className="text-lg text-primary font-semibold">{exp.company}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{exp.location}</span>
                  <Badge variant="outline" className="ml-2">{exp.locationType}</Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground text-right">
                <p className="font-medium">{formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate!)}</p>
                <motion.p 
                  className="text-primary font-bold text-lg"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  {calculateDuration(exp.startDate, exp.current ? undefined : exp.endDate)}
                </motion.p>
              </div>
            </div>
            
            {exp.description && (
              <p className="mt-4 text-muted-foreground leading-relaxed">{exp.description}</p>
            )}
            
            {exp.technologies.length > 0 && (
              <motion.div 
                className="flex flex-wrap gap-2 mt-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  visible: { transition: { staggerChildren: 0.05 } }
                }}
              >
                {exp.technologies.map((tech: string, i: number) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, scale: 0 },
                      visible: { opacity: 1, scale: 1 }
                    }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                    >
                      {tech}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            )}
            
            {exp.responsibilities.length > 0 && (
              <ul className="mt-4 space-y-2">
                {exp.responsibilities.map((resp: string, i: number) => (
                  <motion.li 
                    key={i} 
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span className="text-primary mt-1 text-lg">→</span>
                    <span>{resp}</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TiltCard>
    </motion.div>
  );
}

// Project Card with hover effects
function ProjectCard({ project, index }: { project: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <TiltCard>
        <Card className="h-full overflow-hidden group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50">
          <CardContent className="p-6 relative">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <motion.h3 
                  className="text-xl font-bold group-hover:text-primary transition-colors"
                  whileHover={{ x: 5 }}
                >
                  {project.name}
                </motion.h3>
                <div className="flex gap-1">
                  {project.url && (
                    <motion.div whileHover={{ scale: 1.2, rotate: 15 }} whileTap={{ scale: 0.9 }}>
                      <Button size="icon" variant="ghost" asChild>
                        <a href={project.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </motion.div>
                  )}
                  {project.githubUrl && (
                    <motion.div whileHover={{ scale: 1.2, rotate: -15 }} whileTap={{ scale: 0.9 }}>
                      <Button size="icon" variant="ghost" asChild>
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4" />
                        </a>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : "Present"}
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">{project.description}</p>
              {project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {project.technologies.map((tech: string, i: number) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Badge variant="secondary" className="cursor-pointer">{tech}</Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TiltCard>
    </motion.div>
  );
}

export function PublicPortfolio({ portfolio }: PublicPortfolioProps) {
  const [showResume, setShowResume] = useState(false);
  const [activeSection, setActiveSection] = useState("about");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { personalInfo, education, experience, skills, roles, certifications, projects } = portfolio;

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "github": return <Github className="h-5 w-5" />;
      case "linkedin": return <Linkedin className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  // Filter nav items based on content
  const visibleNavItems = navItems.filter(item => {
    switch (item.id) {
      case "roles": return roles.length > 0;
      case "experience": return experience.length > 0;
      case "skills": return skills.length > 0;
      case "projects": return projects.length > 0;
      case "education": return education.length > 0;
      case "certifications": return certifications.length > 0;
      default: return true;
    }
  });

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <ParticlesBackground />
      
      {/* Progress bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 z-[60] origin-left"
        style={{ scaleX }}
      />
      
      {/* Fixed Header with Navigation */}
      <header className="fixed top-1 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => scrollToSection("about")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading font-bold text-lg hidden sm:block">{personalInfo.fullName}</span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNavItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeSection === item.id 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.label}
              </motion.button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => setShowResume(true)} className="hidden sm:flex">
              <FileText className="h-4 w-4 mr-2" />
              View Resume
            </Button>
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t bg-background/95 backdrop-blur-lg"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
                {visibleNavItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => scrollToSection(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all
                      ${activeSection === item.id 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </motion.button>
                ))}
                <Button onClick={() => { setShowResume(true); setMobileMenuOpen(false); }} className="mt-2">
                  <FileText className="h-4 w-4 mr-2" />
                  View Resume
                </Button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <AnimatedSection id="about" className="relative py-24 px-4 overflow-hidden min-h-[90vh] flex items-center">
          <div className="container mx-auto max-w-5xl">
            <motion.div className="text-center space-y-8">
              {/* Profile Image */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                className="mx-auto relative inline-block"
              >
                {/* Outer animated ring */}
                <motion.div 
                  className="absolute -inset-3 rounded-full"
                  style={{
                    background: "conic-gradient(from 0deg, hsl(var(--primary)), #8b5cf6, #ec4899, #f97316, #eab308, #22c55e, #06b6d4, hsl(var(--primary)))",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Background blur glow */}
                <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 animate-pulse blur-2xl opacity-40" />
                <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-primary to-purple-500 blur-lg opacity-60" />
                
                {/* Inner circle container */}
                <motion.div 
                  className="relative w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-background shadow-2xl"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {personalInfo.profileImage ? (
                    <motion.img 
                      src={personalInfo.profileImage} 
                      alt={personalInfo.fullName}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
                      <User className="w-20 h-20 md:w-24 md:h-24 text-primary/50" />
                    </div>
                  )}
                  
                  {/* Shine effect overlay */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0"
                    initial={{ x: "-100%", y: "-100%" }}
                    animate={{ x: "100%", y: "100%" }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  />
                </motion.div>
                
                {/* Status indicator dot */}
                <motion.div 
                  className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-5 h-5 md:w-6 md:h-6 rounded-full bg-emerald-500 border-4 border-background shadow-lg z-20"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              {/* Name & Title */}
              <div>
                <motion.h1 
                  className="text-5xl md:text-7xl font-heading font-bold"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-gradient-animated">{personalInfo.fullName || "Your Name"}</span>
                </motion.h1>
                <motion.p 
                  className="text-2xl md:text-3xl text-primary mt-4 font-semibold"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {personalInfo.title || "Your Title"}
                </motion.p>
              </div>

              {/* Location */}
              {personalInfo.location && (
                <motion.div 
                  className="flex items-center justify-center gap-2 text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <MapPin className="h-5 w-5" />
                  <span className="text-lg">{personalInfo.location}</span>
                </motion.div>
              )}

              {/* Bio */}
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {personalInfo.bio}
              </motion.p>

              {/* Contact & Social Links */}
              <motion.div 
                className="flex flex-wrap items-center justify-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {personalInfo.email && (
                  <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="lg" asChild className="gap-2">
                      <a href={`mailto:${personalInfo.email}`}>
                        <Mail className="h-5 w-5" />
                        Email
                      </a>
                    </Button>
                  </motion.div>
                )}
                {personalInfo.phone && (
                  <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="lg" asChild className="gap-2">
                      <a href={`tel:${personalInfo.phone}`}>
                        <Phone className="h-5 w-5" />
                        Call
                      </a>
                    </Button>
                  </motion.div>
                )}
                {personalInfo.whatsapp && (
                  <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="lg" asChild className="gap-2">
                      <a href={`https://wa.me/${personalInfo.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                        <FaWhatsapp className="h-5 w-5" />
                        WhatsApp
                      </a>
                    </Button>
                  </motion.div>
                )}
                {personalInfo.socialLinks.map((link, index) => (
                  <motion.div 
                    key={link.id}
                    whileHover={{ scale: 1.1, rotate: 5 }} 
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button variant="outline" size="icon" className="w-12 h-12" asChild>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        {getSocialIcon(link.platform)}
                      </a>
                    </Button>
                  </motion.div>
                ))}
              </motion.div>

              {/* Scroll indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{ delay: 1, y: { repeat: Infinity, duration: 1.5 } }}
                className="pt-8"
              >
                <ChevronDown className="h-8 w-8 mx-auto text-muted-foreground" />
              </motion.div>
            </motion.div>
          </div>

          {/* Animated gradient orbs */}
          <motion.div 
            className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none"
            animate={{ 
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"
            animate={{ 
              x: [0, -50, 0],
              y: [0, -30, 0],
              scale: [1.1, 1, 1.1]
            }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
        </AnimatedSection>

        {/* Roles Section */}
        {roles.length > 0 && (
          <AnimatedSection id="roles" className="py-20 px-4 bg-muted/30">
            <div className="container mx-auto max-w-5xl">
              <motion.h2 
                className="text-4xl font-heading font-bold text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Code className="inline h-10 w-10 mr-3 text-primary" />
                Professional Roles
              </motion.h2>
              <div className="flex flex-wrap justify-center gap-4">
                {roles.map((role, index) => (
                  <RoleCard key={role.id} role={role} index={index} />
                ))}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Experience Section */}
        {experience.length > 0 && (
          <AnimatedSection id="experience" className="py-20 px-4">
            <div className="container mx-auto max-w-5xl">
              <motion.h2 
                className="text-4xl font-heading font-bold text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Briefcase className="inline h-10 w-10 mr-3 text-primary" />
                Work Experience
              </motion.h2>
              <div className="space-y-8">
                {experience.map((exp, index) => (
                  <ExperienceCard key={exp.id} exp={exp} index={index} />
                ))}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Skills Section with Interactive Orbit */}
        {skills.length > 0 && (
          <AnimatedSection id="skills" className="py-20 px-4 bg-muted/30 overflow-hidden">
            <div className="container mx-auto max-w-5xl">
              <motion.h2 
                className="text-4xl font-heading font-bold text-center mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Code className="inline h-10 w-10 mr-3 text-primary" />
                Technical Skills
              </motion.h2>
              <p className="text-center text-muted-foreground mb-8">
                Interactive skill cloud - drag to explore
              </p>
              <SkillsOrbit skills={skills} />
            </div>
          </AnimatedSection>
        )}

        {/* Projects Section */}
        {projects.length > 0 && (
          <AnimatedSection id="projects" className="py-20 px-4">
            <div className="container mx-auto max-w-5xl">
              <motion.h2 
                className="text-4xl font-heading font-bold text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <FolderGit2 className="inline h-10 w-10 mr-3 text-primary" />
                Projects
              </motion.h2>
              <div className="grid md:grid-cols-2 gap-6">
                {projects.map((project, index) => (
                  <ProjectCard key={project.id} project={project} index={index} />
                ))}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Education Section */}
        {education.length > 0 && (
          <AnimatedSection id="education" className="py-20 px-4 bg-muted/30">
            <div className="container mx-auto max-w-5xl">
              <motion.h2 
                className="text-4xl font-heading font-bold text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <GraduationCap className="inline h-10 w-10 mr-3 text-primary" />
                Education
              </motion.h2>
              <div className="space-y-6">
                {education.map((edu, index) => (
                  <motion.div
                    key={edu.id}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                  >
                    <TiltCard>
                      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <motion.div 
                              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0"
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              <GraduationCap className="h-7 w-7 text-primary" />
                            </motion.div>
                            <div>
                              <h3 className="text-xl font-bold">{edu.degree} in {edu.field}</h3>
                              <p className="text-lg text-primary font-semibold">{edu.institution}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {formatDate(edu.startDate)} - {edu.current ? "Present" : formatDate(edu.endDate!)}
                                {edu.gpa && <span className="ml-2 font-medium">| GPA: {edu.gpa}</span>}
                              </p>
                              {edu.description && (
                                <p className="mt-3 text-muted-foreground">{edu.description}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TiltCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Certifications Section */}
        {certifications.length > 0 && (
          <AnimatedSection id="certifications" className="py-20 px-4">
            <div className="container mx-auto max-w-5xl">
              <motion.h2 
                className="text-4xl font-heading font-bold text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Award className="inline h-10 w-10 mr-3 text-primary" />
                Certifications
              </motion.h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {certifications.map((cert, index) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-amber-500/50 group">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                          <motion.div 
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center flex-shrink-0"
                            whileHover={{ rotate: 15, scale: 1.1 }}
                          >
                            <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                          </motion.div>
                          <div>
                            <h3 className="font-bold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {cert.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Issued: {formatDate(cert.issueDate)}
                            </p>
                            {cert.credentialUrl && (
                              <motion.a 
                                href={cert.credentialUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                                whileHover={{ x: 5 }}
                              >
                                View Credential
                                <ExternalLink className="h-3 w-3" />
                              </motion.a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Contact Section */}
        <AnimatedSection id="contact" className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl text-center">
            <motion.h2 
              className="text-4xl font-heading font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Mail className="inline h-10 w-10 mr-3 text-primary" />
              Get In Touch
            </motion.h2>
            <motion.p
              className="text-lg text-muted-foreground mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Feel free to reach out for collaborations or just a friendly hello
            </motion.p>
            <motion.div
              className="flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              {personalInfo.email && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" asChild className="gap-2">
                    <a href={`mailto:${personalInfo.email}`}>
                      <Mail className="h-5 w-5" />
                      Send Email
                    </a>
                  </Button>
                </motion.div>
              )}
              {personalInfo.phone && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" variant="outline" asChild className="gap-2">
                    <a href={`tel:${personalInfo.phone}`}>
                      <Phone className="h-5 w-5" />
                      Call Me
                    </a>
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Footer */}
        <footer className="py-8 px-4 border-t">
          <div className="container mx-auto max-w-5xl text-center text-muted-foreground">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              © {new Date().getFullYear()} {personalInfo.fullName}. Built with Portfolio Builder.
            </motion.p>
          </div>
        </footer>
      </main>

      {/* Resume Modal — show active resume (standard uses profile data, custom uses its own) */}
      <ResumeModal 
        open={showResume} 
        onOpenChange={setShowResume}
        portfolio={(() => {
          const activeR = (portfolio.resumes || []).find((r) => r.isActive);
          if (activeR && !activeR.isStandard && activeR.data) {
            return {
              ...portfolio,
              personalInfo: activeR.data.personalInfo,
              education: activeR.data.education,
              experience: activeR.data.experience,
              skills: activeR.data.skills,
              certifications: activeR.data.certifications,
              projects: activeR.data.projects,
              languages: activeR.data.languages,
            };
          }
          return portfolio;
        })()}
        defaultTemplate={(portfolio.resumes || []).find((r) => r.isActive)?.templateId || "classic"}
        resumeImage={(portfolio.resumes || []).find((r) => r.isActive)?.resumeImage}
      />
    </div>
  );
}
