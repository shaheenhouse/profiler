"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { ParticlesBackground } from "@/components/particles-background";
import { 
  Sparkles, 
  ArrowRight, 
  Code2, 
  Palette, 
  Zap, 
  Shield,
  Globe,
  FileText,
  Users,
  Star
} from "lucide-react";

const features = [
  {
    icon: Code2,
    title: "Developer Focused",
    description: "Built for developers who want to showcase their work professionally",
  },
  {
    icon: Palette,
    title: "Beautiful Design",
    description: "Stunning, modern UI with smooth animations and dark/light mode",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for performance with Next.js and server-side rendering",
  },
  {
    icon: Shield,
    title: "Secure Auth",
    description: "Simple email/password registration keeps your data safe and secure",
  },
  {
    icon: Globe,
    title: "Public Portfolio",
    description: "Share your portfolio with a custom URL that anyone can access",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description: "Create professional resumes with all your skills and experience",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background">
      <ParticlesBackground />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Build Your Dream Portfolio</span>
            </motion.div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight">
              <span className="block">Create Stunning</span>
              <span className="text-gradient-animated">Portfolios & Resumes</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Showcase your skills, experience, and achievements with a beautiful 
              portfolio that stands out. No coding required.
            </p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Button size="xl" variant="gradient" asChild>
                <Link href={session ? "/dashboard" : "/auth/signup"}>
                  {session ? "Go to Dashboard" : "Get Started Free"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="#features">
                  Learn More
                </Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-8 pt-12"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Free Forever</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">5 min</div>
                <div className="text-sm text-muted-foreground">Setup Time</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-3xl font-bold text-primary">
                  <Star className="h-6 w-6 fill-primary" />
                  5.0
                </div>
                <div className="text-sm text-muted-foreground">User Rating</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/30 rounded-full blur-[100px] pointer-events-none" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              All the tools to create a professional portfolio that gets you noticed
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create your portfolio in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Sign Up",
                description: "Create an account with your email in seconds",
                icon: Users,
              },
              {
                step: "02",
                title: "Add Your Info",
                description: "Fill in your skills, experience, and projects",
                icon: FileText,
              },
              {
                step: "03",
                title: "Share",
                description: "Get your unique portfolio URL and share it",
                icon: Globe,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative text-center"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 text-white text-2xl font-bold mb-6">
                  {item.step}
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent" />
                )}
                <h3 className="text-2xl font-heading font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 border border-primary/20 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-grid-white/5" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Ready to Build Your Portfolio?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of professionals who have already created stunning 
                portfolios. It&apos;s free and takes less than 5 minutes.
              </p>
              <Button size="xl" variant="gradient" asChild>
                <Link href={session ? "/dashboard" : "/auth/signup"}>
                  {session ? "Go to Dashboard" : "Create Your Portfolio"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-heading font-bold">PortfolioBuilder</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PortfolioBuilder. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
