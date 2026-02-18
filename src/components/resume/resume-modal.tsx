"use client";

import { useRef, useState, useEffect } from "react";
import { Portfolio } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate, calculateDuration } from "@/lib/utils";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";

interface ResumeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio: Portfolio;
  defaultTemplate?: string;
  resumeImage?: string;
}

const TEMPLATES = [
  { id: "classic", name: "Classic", desc: "ATS-friendly single column" },
  { id: "modern", name: "Modern", desc: "Two-column with sidebar" },
  { id: "minimal", name: "Minimal", desc: "Clean & compact" },
] as const;

type TemplateId = (typeof TEMPLATES)[number]["id"];

// ── Colors ──
const C = {
  primary: "#2563eb",
  primaryDark: "#1e40af",
  primaryBg: "#eff6ff",
  text: "#1f2937",
  textMuted: "#4b5563",
  textLight: "#6b7280",
  border: "#e5e7eb",
  white: "#ffffff",
  skillCatColors: ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"],
};

// ── Inline style shortcuts for page-break control ──
// Applied to EACH individual item so only that item moves to the next page if it doesn't fit
const AVOID_BREAK: React.CSSProperties = { pageBreakInside: "avoid", breakInside: "avoid" };
// Applied to section headings so heading stays with the content below it
const HEADING_KEEP: React.CSSProperties = { pageBreakAfter: "avoid", breakAfter: "avoid" };

// ── Safe language helper ──
function safeLanguages(portfolio: Portfolio) {
  if (!portfolio.languages || !Array.isArray(portfolio.languages)) return [];
  return portfolio.languages.filter((l) => l && l.name && l.proficiency);
}

// ── Group skills by category ──
function groupSkills(skills: Portfolio["skills"]) {
  const grouped: Record<string, typeof skills> = {};
  skills.forEach((s) => {
    const cat = s.category || "General";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  });
  return grouped;
}

// ── Section heading ──
function SH({ title, accent, style }: { title: string; accent?: string; style?: React.CSSProperties }) {
  return (
    <h2
      style={{
        fontSize: "11pt",
        fontWeight: 700,
        color: C.text,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderBottom: `2px solid ${accent || C.primary}`,
        paddingBottom: "1.5mm",
        marginTop: 0,
        marginBottom: "3mm",
        ...HEADING_KEEP,
        ...style,
      }}
    >
      {title}
    </h2>
  );
}

// ── Clickable link helper ──
function ExtLink({ href, children, style }: { href?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  if (!href) return <>{children}</>;
  return (
    <a
      href={href.startsWith("http") ? href : `https://${href}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: C.primary, textDecoration: "none", ...style }}
    >
      {children}
    </a>
  );
}

// ═══════════════════════════════════════════════════
// TEMPLATE: Classic — ATS-friendly single column
// Shows ALL data — no slice limits
// ═══════════════════════════════════════════════════
function ClassicTemplate({ portfolio }: { portfolio: Portfolio }) {
  const { personalInfo, education, experience, skills, certifications, projects } = portfolio;
  const langs = safeLanguages(portfolio);
  const skillsByCategory = groupSkills(skills);
  const catEntries = Object.entries(skillsByCategory);

  return (
    <>
      {/* ═══ 1. HEADER / CONTACT INFO ═══ */}
      <div style={{ display: "flex", alignItems: "center", gap: "8mm", marginBottom: "4mm" }}>
        {/* Profile Photo (optional) */}
        {personalInfo.profileImage && (
          <div
            style={{
              width: "22mm",
              height: "22mm",
              borderRadius: "50%",
              overflow: "hidden",
              border: `2px solid ${C.primary}`,
              flexShrink: 0,
            }}
          >
            <img
              src={personalInfo.profileImage}
              alt={personalInfo.fullName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}
        
        {/* Name and Contact */}
        <div style={{ textAlign: personalInfo.profileImage ? "left" : "center", flex: 1 }}>
          <h1 style={{ fontSize: "22pt", fontWeight: 700, margin: 0, color: C.text }}>
            {personalInfo.fullName || "Your Name"}
          </h1>
          <p style={{ fontSize: "12pt", color: C.primary, margin: "1mm 0", fontWeight: 600 }}>
            {personalInfo.title || "Professional Title"}
          </p>
          <p style={{ fontSize: "9pt", color: C.textLight, margin: "2mm 0 0 0" }}>
            {[
              personalInfo.email && <ExtLink key="email" href={`mailto:${personalInfo.email}`}>{personalInfo.email}</ExtLink>,
              personalInfo.phone,
              personalInfo.location,
              ...personalInfo.socialLinks.map((l) => (
                <ExtLink key={l.id} href={l.url}>{l.label || l.url}</ExtLink>
              )),
            ]
              .filter(Boolean)
              .reduce<React.ReactNode[]>((acc, item, i) => {
                if (i > 0) acc.push(<span key={`sep-${i}`}> &nbsp;|&nbsp; </span>);
                acc.push(item);
                return acc;
              }, [])}
          </p>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: "4mm" }} />

      {/* ═══ 2. PROFESSIONAL SUMMARY ═══ */}
      {personalInfo.bio && (
        <div style={{ marginBottom: "5mm", ...AVOID_BREAK }}>
          <SH title="Professional Summary" />
          <p style={{ fontSize: "9.5pt", color: C.textMuted, lineHeight: "1.5", margin: 0, textAlign: "justify" }}>
            {personalInfo.bio}
          </p>
        </div>
      )}

      {/* ═══ 3. SKILLS — each category is its own breakable unit ═══ */}
      {skills.length > 0 && (
        <div style={{ marginBottom: "5mm" }}>
          <SH title="Skills &amp; Core Competencies" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
            <tbody>
              {catEntries.map(([cat, catSkills], ci) => {
                const accentColor = C.skillCatColors[ci % C.skillCatColors.length];
                return (
                  <tr key={cat} style={AVOID_BREAK}>
                    <td
                      style={{
                        fontWeight: 700,
                        color: accentColor,
                        padding: "1.5mm 4mm 1.5mm 0",
                        verticalAlign: "top",
                        whiteSpace: "nowrap",
                        width: "1%",
                        borderLeft: `3px solid ${accentColor}`,
                        paddingLeft: "2.5mm",
                      }}
                    >
                      {cat}
                    </td>
                    <td style={{ color: C.textMuted, padding: "1.5mm 0", lineHeight: "1.6", verticalAlign: "top" }}>
                      {catSkills.map((s) => s.name).join(", ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ 4. WORK EXPERIENCE — each entry is breakable ═══ */}
      {experience.length > 0 && (
        <div style={{ marginBottom: "5mm" }}>
          <SH title="Work Experience" />
          {experience.map((exp, idx) => (
            <div key={exp.id} style={{ marginBottom: idx < experience.length - 1 ? "4mm" : 0, ...AVOID_BREAK }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: "top", paddingBottom: "1mm" }}>
                      <span style={{ fontSize: "10.5pt", fontWeight: 700, color: C.text }}>{exp.title}</span>
                      <span style={{ fontSize: "10pt", color: C.primary, fontWeight: 600, marginLeft: "2mm" }}>— {exp.company}</span>
                      <span style={{ fontSize: "9pt", color: C.textLight, marginLeft: "2mm" }}>| {exp.location} ({exp.locationType})</span>
                    </td>
                    <td style={{ textAlign: "right", verticalAlign: "top", whiteSpace: "nowrap", fontSize: "9pt", color: C.textLight }}>
                      {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate!)}
                      <br />
                      <span style={{ color: C.primary, fontSize: "8pt" }}>{calculateDuration(exp.startDate, exp.current ? undefined : exp.endDate)}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              {exp.technologies.length > 0 && (
                <p style={{ fontSize: "8.5pt", color: C.textMuted, margin: "1mm 0" }}>
                  <strong>Technologies:</strong> {exp.technologies.join(", ")}
                </p>
              )}
              {exp.responsibilities.length > 0 && (
                <ul style={{ margin: "1mm 0 0 0", paddingLeft: "5mm", fontSize: "9pt", color: C.textMuted, lineHeight: "1.5" }}>
                  {exp.responsibilities.map((r, i) => (
                    <li key={i} style={{ marginBottom: "0.5mm" }}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ 5. EDUCATION — each entry breakable ═══ */}
      {education.length > 0 && (
        <div style={{ marginBottom: "5mm" }}>
          <SH title="Education" />
          {education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: "2mm", ...AVOID_BREAK }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: "top" }}>
                      <span style={{ fontSize: "10pt", fontWeight: 700, color: C.text }}>{edu.degree} in {edu.field}</span>
                      <span style={{ fontSize: "9.5pt", color: C.primary, marginLeft: "2mm" }}>— {edu.institution}</span>
                    </td>
                    <td style={{ textAlign: "right", verticalAlign: "top", whiteSpace: "nowrap", fontSize: "9pt", color: C.textLight }}>
                      {formatDate(edu.startDate)} – {edu.current ? "Present" : formatDate(edu.endDate!)}
                      {edu.gpa && <span style={{ marginLeft: "2mm" }}>| GPA: {edu.gpa}</span>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* ═══ 6. CERTIFICATIONS — each row breakable ═══ */}
      {certifications.length > 0 && (
        <div style={{ marginBottom: "5mm" }}>
          <SH title="Certifications" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
            <tbody>
              {certifications.map((cert) => (
                <tr key={cert.id} style={AVOID_BREAK}>
                  <td style={{ fontWeight: 600, color: C.text, padding: "1mm 0" }}>
                    {cert.credentialUrl ? <ExtLink href={cert.credentialUrl}>{cert.name}</ExtLink> : cert.name}
                  </td>
                  <td style={{ color: C.textMuted, padding: "1mm 3mm" }}>{cert.issuer}</td>
                  <td style={{ textAlign: "right", color: C.textLight, padding: "1mm 0", whiteSpace: "nowrap" }}>
                    {new Date(cert.issueDate).getFullYear()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ 7. ALL PROJECTS — each project is breakable ═══ */}
      {projects.length > 0 && (
        <div style={{ marginBottom: "5mm" }}>
          <SH title="Key Projects" />
          {projects.map((project) => (
            <div key={project.id} style={{ marginBottom: "2.5mm", ...AVOID_BREAK }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: "top" }}>
                      <span style={{ fontSize: "9.5pt", fontWeight: 700, color: C.text }}>
                        {project.url ? <ExtLink href={project.url}>{project.name}</ExtLink> : project.name}
                      </span>
                      {project.githubUrl && (
                        <span style={{ fontSize: "8pt", marginLeft: "2mm" }}>
                          <ExtLink href={project.githubUrl}>[GitHub]</ExtLink>
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right", verticalAlign: "top", whiteSpace: "nowrap", fontSize: "8pt", color: C.textLight }}>
                      {formatDate(project.startDate)} – {project.endDate ? formatDate(project.endDate) : "Present"}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p style={{ fontSize: "9pt", color: C.textMuted, margin: "0.5mm 0" }}>{project.description}</p>
              {project.technologies.length > 0 && (
                <p style={{ fontSize: "8pt", color: C.textLight, margin: 0 }}><strong>Tech:</strong> {project.technologies.join(", ")}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ LANGUAGES ═══ */}
      {langs.length > 0 && (
        <div style={AVOID_BREAK}>
          <SH title="Languages" />
          <p style={{ fontSize: "9pt", color: C.textMuted, margin: 0 }}>
            {langs.map((l) => `${l.name} (${l.proficiency})`).join("  |  ")}
          </p>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════
// TEMPLATE: Modern — Two-column with sidebar
// Shows ALL data — no slice limits
// ═══════════════════════════════════════════════════
function ModernTemplate({ portfolio, resumeImage }: { portfolio: Portfolio; resumeImage?: string }) {
  const { personalInfo, education, experience, skills, certifications, projects } = portfolio;
  const langs = safeLanguages(portfolio);
  const skillsByCategory = groupSkills(skills);
  const catEntries = Object.entries(skillsByCategory);
  const headerImage = resumeImage || personalInfo.profileImage;

  return (
    <>
      {/* ═══ HEADER BANNER ═══ */}
      <div
        style={{
          backgroundColor: "#1e293b",
          margin: "-15mm -15mm 0 -15mm",
          color: C.white,
        }}
      >
        {/* Top section: Photo + Name + Title + Bio */}
        <div
          style={{
            padding: "10mm 15mm 8mm 15mm",
            display: "flex",
            alignItems: "center",
            gap: "12mm",
          }}
        >
          {/* Profile Photo */}
          {headerImage && (
            <div
              style={{
                width: "32mm",
                height: "32mm",
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid rgba(255,255,255,0.25)",
                flexShrink: 0,
                backgroundColor: "#334155",
              }}
            >
              <img
                src={headerImage}
                alt={personalInfo.fullName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          {/* Name, Title, Bio */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "22pt", fontWeight: 700, margin: 0, letterSpacing: "0.3px" }}>
              {personalInfo.fullName || "Your Name"}
            </h1>
            <p style={{ fontSize: "11pt", margin: "1.5mm 0 0 0", opacity: 0.85, fontWeight: 500 }}>
              {personalInfo.title || "Professional Title"}
            </p>
            {personalInfo.bio && (
              <p style={{ fontSize: "8pt", margin: "3mm 0 0 0", opacity: 0.7, lineHeight: "1.55", textAlign: "justify" }}>
                {personalInfo.bio}
              </p>
            )}
          </div>
        </div>

        {/* Contact info bar */}
        <div
          style={{
            backgroundColor: "rgba(0,0,0,0.2)",
            padding: "3mm 15mm",
            fontSize: "7.5pt",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "2mm",
          }}
        >
          {[
            personalInfo.email && (
              <a key="email" href={`mailto:${personalInfo.email}`} style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "1.5mm" }}>
                <span style={{ fontSize: "7pt" }}>✉</span> {personalInfo.email}
              </a>
            ),
            personalInfo.phone && (
              <span key="phone" style={{ display: "inline-flex", alignItems: "center", gap: "1.5mm", color: "rgba(255,255,255,0.9)" }}>
                <span style={{ fontSize: "7pt" }}>☎</span> {personalInfo.phone}
              </span>
            ),
            personalInfo.location && (
              <span key="location" style={{ display: "inline-flex", alignItems: "center", gap: "1.5mm", color: "rgba(255,255,255,0.9)" }}>
                <span style={{ fontSize: "7pt" }}>📍</span> {personalInfo.location}
              </span>
            ),
            ...personalInfo.socialLinks.map((l) => (
              <a
                key={l.id}
                href={l.url.startsWith("http") ? l.url : `https://${l.url}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "1.5mm" }}
              >
                <span style={{ fontSize: "7pt" }}>
                  {l.platform === "github" ? "🔗" : l.platform === "linkedin" ? "🔗" : "🌐"}
                </span>
                {l.label || l.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              </a>
            )),
          ]
            .filter(Boolean)
            .reduce<React.ReactNode[]>((acc, item, i) => {
              if (i > 0) acc.push(<span key={`sep${i}`} style={{ color: "rgba(255,255,255,0.4)", margin: "0 1mm" }}>•</span>);
              acc.push(item);
              return acc;
            }, [])}
        </div>
      </div>

      {/* ═══ Two columns using float (NOT table — tables can't page-break mid-row) ═══ */}
      <div style={{ marginTop: "5mm", overflow: "hidden" }}>
        {/* LEFT COLUMN (65%) — Experience, Projects */}
        <div style={{ float: "left", width: "63%", paddingRight: "5mm" }}>
          {experience.length > 0 && (
            <div style={{ marginBottom: "5mm" }}>
              <SH title="Experience" accent={C.primary} />
              {experience.map((exp, idx) => (
                <div key={exp.id} style={{ marginBottom: idx < experience.length - 1 ? "4mm" : 0, ...AVOID_BREAK }}>
                  <p style={{ fontSize: "10.5pt", fontWeight: 700, color: C.text, margin: 0 }}>{exp.title}</p>
                  <p style={{ fontSize: "9.5pt", color: C.primary, margin: "0.5mm 0", fontWeight: 600 }}>{exp.company} · {exp.location}</p>
                  <p style={{ fontSize: "8pt", color: C.textLight, margin: "0 0 1mm 0" }}>
                    {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate!)} · {calculateDuration(exp.startDate, exp.current ? undefined : exp.endDate)}
                  </p>
                  {exp.technologies.length > 0 && (
                    <p style={{ fontSize: "8pt", color: C.textMuted, margin: "1mm 0" }}>
                      <strong>Tech:</strong> {exp.technologies.join(", ")}
                    </p>
                  )}
                  {exp.responsibilities.length > 0 && (
                    <ul style={{ margin: "1mm 0 0 0", paddingLeft: "4mm", fontSize: "8.5pt", color: C.textMuted, lineHeight: "1.5" }}>
                      {exp.responsibilities.map((r, i) => (
                        <li key={i} style={{ marginBottom: "0.5mm" }}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {projects.length > 0 && (
            <div style={{ marginBottom: "5mm" }}>
              <SH title="Projects" accent={C.primary} />
              {projects.map((project) => (
                <div key={project.id} style={{ marginBottom: "2mm", ...AVOID_BREAK }}>
                  <p style={{ fontSize: "9.5pt", fontWeight: 700, color: C.text, margin: 0 }}>
                    {project.url ? <ExtLink href={project.url}>{project.name}</ExtLink> : project.name}
                    {project.githubUrl && (
                      <span style={{ fontSize: "8pt", marginLeft: "2mm" }}>
                        <ExtLink href={project.githubUrl}>[GitHub]</ExtLink>
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: "8.5pt", color: C.textMuted, margin: "0.5mm 0" }}>{project.description}</p>
                  {project.technologies.length > 0 && (
                    <p style={{ fontSize: "8pt", color: C.textLight, margin: 0 }}>{project.technologies.join(" · ")}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (35%) — Skills, Education, Certs, Languages */}
        <div style={{ marginLeft: "65%", paddingLeft: "5mm", borderLeft: `1px solid ${C.border}` }}>
          {skills.length > 0 && (
            <div style={{ marginBottom: "5mm" }}>
              <SH title="Skills" accent={C.primary} style={{ fontSize: "10pt" }} />
              {catEntries.map(([cat, catSkills], ci) => {
                const accent = C.skillCatColors[ci % C.skillCatColors.length];
                return (
                  <div key={cat} style={{ marginBottom: "2.5mm", ...AVOID_BREAK }}>
                    <p
                      style={{
                        fontSize: "8pt",
                        fontWeight: 700,
                        color: accent,
                        margin: "0 0 0.5mm 0",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                        borderLeft: `2px solid ${accent}`,
                        paddingLeft: "2mm",
                      }}
                    >
                      {cat}
                    </p>
                    <p style={{ fontSize: "8pt", color: C.textMuted, margin: 0, lineHeight: "1.5", paddingLeft: "2mm" }}>
                      {catSkills.map((s) => s.name).join(", ")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {education.length > 0 && (
            <div style={{ marginBottom: "5mm" }}>
              <SH title="Education" accent={C.primary} style={{ fontSize: "10pt" }} />
              {education.map((edu) => (
                <div key={edu.id} style={{ marginBottom: "2mm", ...AVOID_BREAK }}>
                  <p style={{ fontSize: "8.5pt", fontWeight: 700, color: C.text, margin: 0 }}>{edu.degree}</p>
                  <p style={{ fontSize: "8pt", color: C.textMuted, margin: "0.5mm 0" }}>{edu.field}</p>
                  <p style={{ fontSize: "8pt", color: C.primary, margin: 0 }}>{edu.institution}</p>
                  <p style={{ fontSize: "7.5pt", color: C.textLight, margin: "0.5mm 0 0 0" }}>
                    {formatDate(edu.startDate)} – {edu.current ? "Present" : formatDate(edu.endDate!)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {certifications.length > 0 && (
            <div style={{ marginBottom: "5mm" }}>
              <SH title="Certifications" accent={C.primary} style={{ fontSize: "10pt" }} />
              {certifications.map((cert) => (
                <div key={cert.id} style={{ ...AVOID_BREAK, marginBottom: "1.5mm" }}>
                  <p style={{ fontSize: "8pt", color: C.textMuted, margin: 0 }}>
                    <span style={{ fontWeight: 600, color: C.text }}>
                      {cert.credentialUrl ? <ExtLink href={cert.credentialUrl}>{cert.name}</ExtLink> : cert.name}
                    </span>
                    <br />
                    <span style={{ fontSize: "7.5pt" }}>{cert.issuer} · {new Date(cert.issueDate).getFullYear()}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {langs.length > 0 && (
            <div style={AVOID_BREAK}>
              <SH title="Languages" accent={C.primary} style={{ fontSize: "10pt" }} />
              {langs.map((l) => (
                <p key={l.id} style={{ fontSize: "8pt", color: C.textMuted, margin: "0 0 1mm 0" }}>
                  <span style={{ fontWeight: 600, color: C.text }}>{l.name}</span> — {l.proficiency}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Clear float */}
        <div style={{ clear: "both" }} />
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════
// TEMPLATE: Minimal — Clean, compact
// Shows ALL data — no slice limits
// ═══════════════════════════════════════════════════
function MinimalTemplate({ portfolio }: { portfolio: Portfolio }) {
  const { personalInfo, education, experience, skills, certifications, projects } = portfolio;
  const langs = safeLanguages(portfolio);
  const skillsByCategory = groupSkills(skills);
  const catEntries = Object.entries(skillsByCategory);

  // Minimal heading style
  const mh: React.CSSProperties = {
    fontSize: "9pt", fontWeight: 700, color: C.text,
    textTransform: "uppercase", letterSpacing: "1.5px",
    margin: "0 0 2mm 0", ...HEADING_KEEP,
  };

  return (
    <>
      {/* HEADER */}
      <div style={{ marginBottom: "5mm", borderBottom: `1px solid ${C.text}`, paddingBottom: "3mm", display: "flex", alignItems: "center", gap: "6mm" }}>
        {/* Profile Photo (optional) */}
        {personalInfo.profileImage && (
          <div
            style={{
              width: "20mm",
              height: "20mm",
              borderRadius: "3mm",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <img
              src={personalInfo.profileImage}
              alt={personalInfo.fullName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}
        
        {/* Name and Contact */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "20pt", fontWeight: 300, margin: 0, color: C.text, letterSpacing: "1px" }}>
            {personalInfo.fullName?.toUpperCase() || "YOUR NAME"}
          </h1>
          <p style={{ fontSize: "10pt", color: C.textMuted, margin: "1.5mm 0 0 0" }}>{personalInfo.title}</p>
          <p style={{ fontSize: "8.5pt", color: C.textLight, margin: "2mm 0 0 0" }}>
            {[
              personalInfo.email && <ExtLink key="email" href={`mailto:${personalInfo.email}`}>{personalInfo.email}</ExtLink>,
              personalInfo.phone,
              personalInfo.location,
              ...personalInfo.socialLinks.map((l) => (
                <ExtLink key={l.id} href={l.url}>{l.label || l.url}</ExtLink>
              )),
            ]
              .filter(Boolean)
              .reduce<React.ReactNode[]>((acc, item, i) => {
                if (i > 0) acc.push(<span key={`sp${i}`}> &nbsp;·&nbsp; </span>);
                acc.push(item);
                return acc;
              }, [])}
          </p>
        </div>
      </div>

      {personalInfo.bio && (
        <div style={{ marginBottom: "5mm", ...AVOID_BREAK }}>
          <p style={{ fontSize: "9pt", color: C.textMuted, lineHeight: "1.6", margin: 0 }}>{personalInfo.bio}</p>
        </div>
      )}

      {/* Skills — each category row is breakable */}
      {skills.length > 0 && (
        <div style={{ marginBottom: "5mm" }}>
          <h2 style={mh}>Skills</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5pt" }}>
            <tbody>
              {catEntries.map(([cat, catSkills]) => (
                <tr key={cat} style={AVOID_BREAK}>
                  <td style={{ fontWeight: 700, color: C.text, padding: "0.5mm 3mm 0.5mm 0", verticalAlign: "top", whiteSpace: "nowrap", width: "1%" }}>
                    {cat}:
                  </td>
                  <td style={{ color: C.textMuted, padding: "0.5mm 0", lineHeight: "1.5" }}>
                    {catSkills.map((s) => s.name).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Experience — each entry breakable */}
      {experience.length > 0 && (
        <div style={{ marginBottom: "5mm" }}>
          <h2 style={{ ...mh, marginBottom: "3mm" }}>Experience</h2>
          {experience.map((exp, idx) => (
            <div key={exp.id} style={{ marginBottom: idx < experience.length - 1 ? "4mm" : 0, ...AVOID_BREAK }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: "top" }}>
                      <span style={{ fontSize: "10pt", fontWeight: 600, color: C.text }}>{exp.title}</span>
                      <span style={{ fontSize: "9pt", color: C.textMuted }}> at {exp.company}, {exp.location}</span>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: "8.5pt", color: C.textLight, verticalAlign: "top" }}>
                      {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate!)}
                    </td>
                  </tr>
                </tbody>
              </table>
              {exp.responsibilities.length > 0 && (
                <ul style={{ margin: "1mm 0 0 0", paddingLeft: "4mm", fontSize: "8.5pt", color: C.textMuted, lineHeight: "1.5" }}>
                  {exp.responsibilities.map((r, i) => (
                    <li key={i} style={{ marginBottom: "0.3mm" }}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education — each entry breakable */}
      {education.length > 0 && (
        <div style={{ marginBottom: "5mm" }}>
          <h2 style={mh}>Education</h2>
          {education.map((edu) => (
            <div key={edu.id} style={{ ...AVOID_BREAK, marginBottom: "1mm" }}>
              <p style={{ fontSize: "9pt", color: C.textMuted, margin: 0 }}>
                <strong style={{ color: C.text }}>{edu.degree} in {edu.field}</strong> — {edu.institution}
                <span style={{ float: "right", fontSize: "8.5pt", color: C.textLight }}>
                  {formatDate(edu.startDate)} – {edu.current ? "Present" : formatDate(edu.endDate!)}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Certifications — each breakable */}
      {certifications.length > 0 && (
        <div style={{ marginBottom: "5mm" }}>
          <h2 style={mh}>Certifications</h2>
          {certifications.map((c) => (
            <div key={c.id} style={{ ...AVOID_BREAK, marginBottom: "1mm" }}>
              <p style={{ fontSize: "9pt", color: C.textMuted, margin: 0 }}>
                {c.credentialUrl ? <ExtLink href={c.credentialUrl}>{c.name}</ExtLink> : c.name}
                {" "}({c.issuer}, {new Date(c.issueDate).getFullYear()})
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Projects — ALL, each breakable */}
      {projects.length > 0 && (
        <div style={{ marginBottom: "5mm" }}>
          <h2 style={mh}>Projects</h2>
          {projects.map((p) => (
            <div key={p.id} style={{ marginBottom: "1.5mm", ...AVOID_BREAK }}>
              <p style={{ fontSize: "8.5pt", color: C.textMuted, margin: 0 }}>
                <strong style={{ color: C.text }}>
                  {p.url ? <ExtLink href={p.url}>{p.name}</ExtLink> : p.name}
                </strong>
                {p.githubUrl && (
                  <span style={{ marginLeft: "2mm" }}><ExtLink href={p.githubUrl}>[Code]</ExtLink></span>
                )}
                {" — "}{p.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Languages */}
      {langs.length > 0 && (
        <div style={AVOID_BREAK}>
          <h2 style={mh}>Languages</h2>
          <p style={{ fontSize: "9pt", color: C.textMuted, margin: 0 }}>
            {langs.map((l) => `${l.name} (${l.proficiency})`).join("  ·  ")}
          </p>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════
// Main Resume Modal
// ═══════════════════════════════════════════════════
export function ResumeModal({ open, onOpenChange, portfolio, defaultTemplate, resumeImage }: ResumeModalProps) {
  const resumeRef = useRef<HTMLDivElement>(null);
  const [templateId, setTemplateId] = useState<TemplateId>((defaultTemplate as TemplateId) || "classic");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (defaultTemplate && TEMPLATES.some((t) => t.id === defaultTemplate)) {
      setTemplateId(defaultTemplate as TemplateId);
    }
  }, [defaultTemplate]);

  // ── Print-to-PDF: produces real selectable text, clickable links ──
  const handleDownloadPDF = () => {
    if (!resumeRef.current || isDownloading) return;
    setIsDownloading(true);

    try {
      const content = resumeRef.current.innerHTML;
      const title = `${portfolio.personalInfo.fullName || "Resume"} - Resume`;

      const printWindow = window.open("", "_blank", "width=900,height=1100");
      if (!printWindow) {
        alert("Please allow pop-ups to download the PDF.");
        setIsDownloading(false);
        return;
      }

      // Enhanced print CSS with proper page margins and page-break rules
      printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  /* Page margins — ensures top/bottom padding on EVERY page including page 2+ */
  @page {
    margin: 12mm 15mm 10mm 15mm;
    size: A4;
  }
  /* First page: no top margin (banner goes edge-to-edge for modern template) */
  @page :first {
    margin-top: 0;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 210mm;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #1f2937;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    padding: 0 15mm 0 15mm;
  }
  a { color: #2563eb; text-decoration: none; }
  table { border-collapse: collapse; }
  ul { list-style-position: outside; }

  /* ── Page-break rules ── */
  h1, h2, h3 {
    page-break-after: avoid;
    break-after: avoid;
    orphans: 3;
    widows: 3;
  }
  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  li {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  p {
    orphans: 3;
    widows: 3;
  }

  @media print {
    html, body { width: 210mm; }
    body { padding: 0 15mm; }
    h2 { page-break-after: avoid !important; break-after: avoid !important; }
    tr { page-break-inside: avoid !important; break-inside: avoid !important; }
  }
</style>
</head>
<body>${content}</body>
</html>`);
      printWindow.document.close();

      // Wait for rendering, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 300);
      };

      // Also try after a timeout in case onload already fired
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          // Already printed or window closed
        }
      }, 800);

      // Cleanup
      const cleanup = () => {
        setIsDownloading(false);
      };
      printWindow.onafterprint = () => {
        cleanup();
        setTimeout(() => {
          try { printWindow.close(); } catch { /* ok */ }
        }, 200);
      };

      // Fallback cleanup if onafterprint doesn't fire
      setTimeout(cleanup, 10000);
    } catch (err) {
      console.error("PDF export error:", err);
      setIsDownloading(false);
    }
  };

  const currentIdx = TEMPLATES.findIndex((t) => t.id === templateId);
  const cycleTemplate = (dir: 1 | -1) => {
    setTemplateId(TEMPLATES[(currentIdx + dir + TEMPLATES.length) % TEMPLATES.length].id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-[95vw] max-h-[95vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Resume</h2>
            <div className="flex items-center gap-1 bg-muted rounded-lg px-1 py-0.5">
              <Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => cycleTemplate(-1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-medium px-2 min-w-[80px] text-center">{TEMPLATES[currentIdx].name}</span>
              <Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => cycleTemplate(1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">{TEMPLATES[currentIdx].desc}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownloadPDF} className="gap-2" disabled={isDownloading}>
              <Download className="h-4 w-4" />
              {isDownloading ? "Generating..." : "Save as PDF"}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(95vh-60px)]">
          <div className="p-4 flex justify-center" style={{ backgroundColor: "#e5e7eb" }}>
            {/* A4 Page Preview */}
            <div
              ref={resumeRef}
              style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "15mm",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "10pt",
                lineHeight: "1.4",
                backgroundColor: "#ffffff",
                color: C.text,
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
            >
              {templateId === "classic" && <ClassicTemplate portfolio={portfolio} />}
              {templateId === "modern" && <ModernTemplate portfolio={portfolio} resumeImage={resumeImage} />}
              {templateId === "minimal" && <MinimalTemplate portfolio={portfolio} />}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
