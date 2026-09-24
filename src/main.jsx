import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard, FileText, BriefcaseBusiness, Compass, BarChart3,
  Settings, Bell, Search, Upload, ChevronRight, TrendingUp,
  CheckCircle2, AlertCircle, Sparkles, Target, Menu, X, Moon,
  FileCheck2, LoaderCircle, Trash2, ExternalLink
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

import mammoth from "mammoth";
import "./styles.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const nav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "resume", label: "Resume Analysis", icon: FileText },
  { id: "jobs", label: "Job Matching", icon: BriefcaseBusiness },
  { id: "career", label: "Career Advisor", icon: Compass },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings }
];

const SKILLS = [
  "python","java","javascript","typescript","c++","c","sql","html","css","react",
  "node.js","node","express","mongodb","mysql","postgresql","pandas","numpy",
  "scikit-learn","tensorflow","pytorch","machine learning","deep learning",
  "nlp","computer vision","power bi","tableau","excel","aws","azure","gcp",
  "docker","git","github","linux","spark","hadoop","matplotlib","seaborn"
];


function detectJDSkills(text) {
  const skills = [
    "python","java","javascript","typescript","c++","c","sql","html","css","react",
    "node.js","node","express","mongodb","mysql","postgresql","pandas","numpy",
    "scikit-learn","tensorflow","pytorch","machine learning","deep learning",
    "nlp","computer vision","power bi","tableau","excel","aws","azure","gcp",
    "docker","git","github","linux","spark","hadoop","matplotlib","seaborn",
    "data analysis","data visualization","statistics","communication","problem solving"
  ];
  const lower = text.toLowerCase();
  return [...new Set(skills.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, "i").test(lower);
  }))];
}

function matchResumeToJD(resumeText, jdText) {
  const resumeSkills = detectJDSkills(resumeText);
  const jdSkills = detectJDSkills(jdText);
  const matched = jdSkills.filter(s => resumeSkills.includes(s));
  const missing = jdSkills.filter(s => !resumeSkills.includes(s));
  const jdTerms = [...new Set(jdText.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").split(/\s+/).filter(w => w.length >= 4))];
  const resumeLower = resumeText.toLowerCase();
  const matchedTerms = jdTerms.filter(t => resumeLower.includes(t));
  const keywordCoverage = jdTerms.length ? Math.round(Math.min(100, matchedTerms.length / Math.min(jdTerms.length, 100) * 100)) : 0;
  const skillScore = jdSkills.length ? Math.round(matched.length / jdSkills.length * 100) : 0;
  const educationRequired = /(degree|bachelor|b\.tech|computer science|engineering|graduate|qualification)/i.test(jdText);
  const experienceRequired = /(experience|years|internship|intern|work experience)/i.test(jdText);
  const educationFound = /(degree|bachelor|b\.tech|computer science|engineering|university|college)/i.test(resumeText);
  const experienceFound = /(experience|internship|intern|employment|worked|developer|analyst|engineer)/i.test(resumeText);
  let fit = skillScore * 0.65 + keywordCoverage * 0.2;
  fit += (!educationRequired || educationFound) ? 7 : 0;
  fit += (!experienceRequired || experienceFound) ? 8 : 0;
  fit = Math.round(Math.max(0, Math.min(100, fit)));
  const verdict = fit >= 85 ? "Excellent match" : fit >= 70 ? "Strong match" : fit >= 55 ? "Moderate match" : "Needs improvement";
  const recommendations = [];
  if (missing.length) recommendations.push(`Strengthen relevant skills: ${missing.slice(0,5).join(", ")}.`);
  if (keywordCoverage < 60) recommendations.push("Tailor resume wording to the job description and include relevant terminology naturally.");
  if (experienceRequired && !experienceFound) recommendations.push("Highlight internships, projects, or practical experience related to this role.");
  if (!recommendations.length) recommendations.push("Your resume covers the main signals detected in this job description. Focus on measurable achievements and role-specific impact.");
  return { fit, verdict, resumeSkills, jdSkills, matched, missing, keywordCoverage, skillScore, matchedTerms: matchedTerms.slice(0,30), recommendations };
}

const SECTION_RULES = [
  ["Contact", /(email|phone|mobile|linkedin|github|portfolio)/i],
  ["Summary", /(summary|objective|profile|about me)/i],
  ["Education", /(education|academic|b\.?tech|bachelor|degree|university|college)/i],
  ["Experience", /(experience|employment|internship|intern|work history)/i],
  ["Projects", /(projects|project experience)/i],
  ["Skills", /(skills|technical skills|technologies)/i],
  ["Certifications", /(certifications?|certificates?)/i]
];

async function extractText(file) {
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext === "pdf") {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let text = "";
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str || "").join(" ") + "\n";
    }
    return text;
  }
  if (ext === "docx") {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value || "";
  }
  throw new Error("Please upload a PDF or DOCX file.");
}

function analyzeResume(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  const lower = clean.toLowerCase();
  const words = clean ? clean.split(/\s+/).length : 0;
  const foundSkills = [...new Set(SKILLS.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, "i").test(lower);
  }))];

  const sections = SECTION_RULES.map(([name, rule]) => ({
    name,
    found: rule.test(clean)
  }));
  const sectionCount = sections.filter(s => s.found).length;

  const quantified = (clean.match(/\b\d+(?:\.\d+)?\s*(?:%|percent|x|users?|projects?|days?|months?|years?|hours?|₹|\$|k\b|m\b)\b/gi) || []).length;
  const actionVerbs = (clean.match(/\b(led|built|developed|created|designed|implemented|optimized|improved|analyzed|automated|deployed|managed|reduced|increased|delivered|engineered)\b/gi) || []).length;
  const links = (clean.match(/https?:\/\/|www\./gi) || []).length;
  const bulletLike = (text.match(/(?:^|\n)\s*(?:[-•*▪◦]|\d+[.)])\s+/g) || []).length;

  let ats = 40;
  ats += Math.min(sectionCount * 6, 42);
  ats += Math.min(foundSkills.length * 1.2, 10);
  ats += Math.min(quantified * 2, 6);
  ats = Math.round(Math.min(ats, 96));

  let score = 35;
  score += Math.min(sectionCount * 6, 42);
  score += Math.min(foundSkills.length * 1.4, 14);
  score += Math.min(quantified * 1.5, 6);
  score += Math.min(actionVerbs * 0.5, 5);
  score += links > 0 ? 3 : 0;
  score += bulletLike > 2 ? 2 : 0;
  score = Math.round(Math.min(score, 98));

  const keywordCoverage = Math.round(Math.min(35 + foundSkills.length * 2.4 + sectionCount * 3, 95));
  const strengths = [];
  const warnings = [];

  if (sections.find(s => s.name === "Skills")?.found) strengths.push(["Clear skills section", "Technical skills are easy for ATS systems to locate."]);
  else warnings.push(["Skills section missing", "Add a dedicated technical skills section."]);
  if (sections.find(s => s.name === "Projects")?.found) strengths.push(["Projects included", "Projects give recruiters evidence of practical work."]);
  else warnings.push(["Projects section missing", "Add 2–3 relevant projects with outcomes."]);
  if (quantified >= 2) strengths.push(["Measurable achievements", "You use numbers that make impact easier to evaluate."]);
  else warnings.push(["Add measurable impact", "Use numbers such as %, users, time saved, or accuracy."]);
  if (foundSkills.length >= 6) strengths.push(["Strong technical coverage", `${foundSkills.length} recognizable technical skills were detected.`]);
  else warnings.push(["Expand relevant keywords", "Add role-specific skills from your target job descriptions."]);
  if (links > 0) strengths.push(["Professional links detected", "A portfolio, GitHub, or LinkedIn link was found."]);
  else warnings.push(["Add professional links", "Consider adding GitHub, LinkedIn, or a portfolio."]);
  if (words < 180) warnings.push(["Resume looks short", "Add meaningful project or experience detail if appropriate."]);
  if (words > 1200) warnings.push(["Resume may be too long", "Consider tightening low-value content."]);

  const missing = SKILLS.filter(s => !foundSkills.includes(s)).slice(0, 8);

  return {
    rawText: clean,
    score, ats, jobMatch: Math.round(Math.min(96, 45 + keywordCoverage * 0.45)),
    skills: foundSkills, keywordCoverage, sections, strengths: strengths.slice(0,4),
    warnings: warnings.slice(0,5), missing, words, pagesEstimate: Math.max(1, Math.ceil(words / 550)),
    quantified, actionVerbs
  };
}

function ScoreRing({ value, label }) {
  return (
    <div className="score-ring" style={{"--value": `${value * 3.6}deg`}}>
      <div className="ring-inner">
        <strong>{value}</strong><span>/100</span><em>{label}</em>
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const current = nav.find(n => n.id === page);

  async function handleFile(file) {
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      const text = await extractText(file);
      if (text.trim().length < 50) throw new Error("Very little text was found. If this is a scanned/image-only PDF, upload a text-based PDF or DOCX.");
      setAnalysis(analyzeResume(text));
      setFileName(file.name);
      setPage("dashboard");
    } catch (e) {
      setError(e.message || "Could not analyze this file.");
    } finally {
      setLoading(false);
    }
  }

  function clearAnalysis() {
    setAnalysis(null); setFileName(""); setError("");
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Sparkles size={19}/></div><div><b>CareerLens</b><span>Career intelligence</span></div><button className="mobile-close" onClick={()=>setMobileOpen(false)}><X size={19}/></button></div>
        <div className="nav-label">WORKSPACE</div>
        <nav>{nav.map(item=>{const Icon=item.icon;return <button key={item.id} className={page===item.id?"nav-item active":"nav-item"} onClick={()=>{setPage(item.id);setMobileOpen(false)}}><Icon size={18}/><span>{item.label}</span>{page===item.id&&<ChevronRight size={15} className="nav-arrow"/>}</button>})}</nav>
        <div className="sidebar-bottom">
          <div className="profile-mini"><div className="avatar">VK</div><div><b>Vivek</b><span>Data Science Student</span></div><Settings size={16}/></div>
        </div>
      </aside>
      {mobileOpen && <div className="overlay" onClick={()=>setMobileOpen(false)}/>}
      <main className="main">
        <header className="topbar"><button className="mobile-menu" onClick={()=>setMobileOpen(true)}><Menu/></button><div className="breadcrumb"><span>CareerLens</span><ChevronRight size={14}/><b>{current?.label}</b></div><div className="top-actions"><div className="search"><Search size={16}/><input placeholder="Search..." /></div><button className="icon-btn"><Bell size={18}/><i/></button><button className="icon-btn"><Moon size={18}/></button></div></header>
        {error && <div className="error-banner"><AlertCircle size={16}/><span>{error}</span><button onClick={()=>setError("")}><X size={14}/></button></div>}
        <div className="content">
          {page==="dashboard" && <Dashboard analysis={analysis} fileName={fileName} setPage={setPage} loading={loading} onFile={handleFile} onClear={clearAnalysis}/>}
          {page==="resume" && <ResumePage analysis={analysis} fileName={fileName} loading={loading} onFile={handleFile} onClear={clearAnalysis}/>}
          {page==="jobs" && <JobsPage analysis={analysis}/>}
          {page==="career" && <CareerPage analysis={analysis}/>}
          {page==="analytics" && <AnalyticsPage analysis={analysis}/>}
          {page==="settings" && <SettingsPage/>}
        </div>
      </main>
    </div>
  );
}

function EmptyStat({title}) {
  return <div className="stat-card empty-stat"><div className="stat-top"><span>{title}</span><TrendingUp size={16}/></div><div className="stat-value dash">—</div><div className="change">Upload a resume to calculate</div></div>;
}

function Stat({title,value,suffix,change}) {
  return <div className="stat-card"><div className="stat-top"><span>{title}</span><TrendingUp size={16}/></div><div className="stat-value">{value}<small>{suffix}</small></div><div className="change positive">{change}</div></div>;
}

function Dashboard({analysis,fileName,setPage,loading,onFile,onClear}) {
  const inputRef=useRef();
  return <>
    <section className="welcome"><div><p className="eyebrow">{new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase()}</p><h1>{(h=>h<12?"Good morning":h<17?"Good afternoon":"Good evening")(new Date().getHours())}, Vivek <span>👋</span></h1><p className="muted">{analysis ? `Latest analysis: ${fileName}` : "Upload your resume to get a real career snapshot."}</p></div><button className="primary" onClick={()=>inputRef.current?.click()} disabled={loading}>{loading?<><LoaderCircle className="spin" size={17}/> Analyzing...</>:<><Upload size={17}/> Analyze Resume</>}<input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={e=>onFile(e.target.files?.[0])}/></button></section>
    {!analysis ? <><div className="stats-grid"><EmptyStat title="Resume Score"/><EmptyStat title="ATS Score"/><EmptyStat title="Job Match"/><EmptyStat title="Skills Detected"/></div><EmptyDashboard setPage={setPage} onUpload={()=>inputRef.current?.click()}/></> : <RealDashboard analysis={analysis} setPage={setPage} onClear={onClear}/>}
  </>;
}

function EmptyDashboard({setPage,onUpload}) {
  return <><div className="empty-hero panel"><div className="empty-icon"><FileCheck2 size={25}/></div><div><p className="eyebrow">NO RESUME ANALYZED</p><h2>Your dashboard is ready.</h2><p>Upload a PDF or DOCX resume and CareerLens will extract its text, detect skills, check key sections, and calculate scores.</p><button className="primary" onClick={onUpload}><Upload size={16}/> Upload Resume</button></div></div><div className="dashboard-grid"><section className="panel"><PanelTitle title="What CareerLens checks"/><HealthItem icon={<CheckCircle2/>} title="Resume structure" text="Education, experience, projects, skills and contact details." good/><HealthItem icon={<CheckCircle2/>} title="ATS-friendly signals" text="Keywords, sections, measurable achievements and links." good/><HealthItem icon={<CheckCircle2/>} title="Career fit" text="Technical skill coverage is used for an initial job-match estimate." good/></section><section className="panel recommendation"><div className="rec-icon"><Sparkles size={20}/></div><div><p className="eyebrow">CAREERLENS</p><h3>Start with your latest resume</h3><p>Your results will be based on the actual text extracted from the file—not placeholder scores.</p><button className="text-btn" onClick={()=>setPage("resume")}>Open Resume Analysis <ChevronRight size={15}/></button></div></section></div></>
}

function RealDashboard({analysis,setPage,onClear}) {
  return <>
    <div className="analysis-banner"><div><FileCheck2 size={18}/><div><b>Resume analyzed successfully</b><span>{analysis.words} words · about {analysis.pagesEstimate} page{analysis.pagesEstimate>1?"s":""} · {analysis.skills.length} skills detected</span></div></div><button className="clear-btn" onClick={onClear}><Trash2 size={14}/> Clear</button></div>
    <div className="stats-grid"><Stat title="Resume Score" value={analysis.score} suffix="/100" change="Calculated from your resume"/><Stat title="ATS Score" value={analysis.ats} suffix="/100" change="Structure + keyword signals"/><Stat title="Job Match" value={analysis.jobMatch} suffix="%" change="Initial profile estimate"/><Stat title="Skills Detected" value={analysis.skills.length} suffix="" change="From resume text"/></div>
    <div className="dashboard-grid"><section className="panel resume-health"><PanelTitle title="Resume Health" action="View analysis" onClick={()=>setPage("resume")}/><div className="health-body"><ScoreRing value={analysis.score} label="Overall score"/><div className="health-list">{analysis.strengths.slice(0,2).map(([t,x])=><HealthItem key={t} icon={<CheckCircle2/>} title={t} text={x} good/>)}{analysis.warnings.slice(0,2).map(([t,x])=><HealthItem key={t} icon={<AlertCircle/>} title={t} text={x}/>)}</div></div></section><section className="panel"><PanelTitle title="Detected Skills" action="View all" onClick={()=>setPage("resume")}/><div className="chips">{analysis.skills.slice(0,14).map(s=><span key={s}>{s}</span>)}</div>{analysis.skills.length===0&&<p className="muted">No recognized skills were detected yet.</p>}</section></div>
    <div className="dashboard-grid lower"><section className="panel"><PanelTitle title="Skill Gap" action="Career roadmap" onClick={()=>setPage("career")}/><div className="skill-row"><span>Keywords</span><div className="progress"><i style={{width:`${analysis.keywordCoverage}%`}}/></div><b>{analysis.keywordCoverage}%</b></div><div className="skill-row"><span>Technical skills</span><div className="progress"><i style={{width:`${Math.min(95,analysis.skills.length*5)}%`}}/></div><b>{Math.min(95,analysis.skills.length*5)}%</b></div><div className="skill-row"><span>Achievements</span><div className="progress"><i style={{width:`${Math.min(95,35+analysis.quantified*12)}%`}}/></div><b>{Math.min(95,35+analysis.quantified*12)}%</b></div></section><section className="panel recommendation"><div className="rec-icon"><Sparkles size={20}/></div><div><p className="eyebrow">CAREERLENS INSIGHT</p><h3>{analysis.warnings[0]?.[0] || "Keep building"} </h3><p>{analysis.warnings[0]?.[1] || "Your resume has a solid foundation. Keep tailoring it to your target roles."}</p><button className="text-btn" onClick={()=>setPage("resume")}>See detailed recommendations <ChevronRight size={15}/></button></div></section></div>
  </>;
}

function PanelTitle({title,action,onClick}){return <div className="panel-title"><h2>{title}</h2>{action&&<button className="link-btn" onClick={onClick}>{action}<ChevronRight size={14}/></button>}</div>}
function HealthItem({icon,title,text,good}){return <div className="health-item"><div className={good?"health-icon good":"health-icon warn"}>{icon}</div><div><b>{title}</b><span>{text}</span></div></div>}

function ResumePage({analysis,fileName,loading,onFile,onClear}) {
  const inputRef=useRef();
  return <Page title="Resume Analysis" subtitle="Your results are calculated from the text extracted from your uploaded resume.">
    <div className="upload-box"><div className="upload-icon">{loading?<LoaderCircle className="spin"/>:<Upload/>}</div><h2>{loading?"Analyzing your resume...":analysis?fileName:"Drop your resume here"}</h2><p>PDF or DOCX · Max 10 MB · Text-based PDF recommended</p><div className="upload-actions"><button className="primary" onClick={()=>inputRef.current?.click()} disabled={loading}>{analysis?"Analyze another resume":"Choose Resume"}</button>{analysis&&<button className="secondary" onClick={onClear}><Trash2 size={15}/> Clear analysis</button>}</div><input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={e=>onFile(e.target.files?.[0])}/></div>
    {!analysis ? <div className="empty-hero panel"><FileText size={23}/><div><b>No resume loaded</b><span>Upload a file to see scores, detected skills, sections, strengths and recommendations.</span></div></div> : <><div className="stats-grid three"><Stat title="Resume Score" value={analysis.score} suffix="/100" change="Calculated from content"/><Stat title="ATS Score" value={analysis.ats} suffix="/100" change="Structure + keyword signals"/><Stat title="Keyword Coverage" value={analysis.keywordCoverage} suffix="%" change={`${analysis.skills.length} skills detected`}/></div><div className="dashboard-grid"><section className="panel"><PanelTitle title="Strengths"/>{analysis.strengths.map(([t,x])=><HealthItem key={t} icon={<CheckCircle2/>} title={t} text={x} good/>)}{analysis.strengths.length===0&&<p className="muted">No strong signals detected yet.</p>}</section><section className="panel"><PanelTitle title="Needs attention"/>{analysis.warnings.map(([t,x])=><HealthItem key={t} icon={<AlertCircle/>} title={t} text={x}/>)}</section></div><section className="panel"><PanelTitle title="Resume sections"/><div className="section-grid">{analysis.sections.map(s=><div className={s.found?"section-card found":"section-card"} key={s.name}>{s.found?<CheckCircle2 size={16}/>:<AlertCircle size={16}/>}<span>{s.name}</span><b>{s.found?"Found":"Missing"}</b></div>)}</div></section><section className="panel skill-panel"><PanelTitle title={`Detected skills (${analysis.skills.length})`}/><div className="chips">{analysis.skills.map(s=><span key={s}>{s}</span>)}</div>{analysis.missing.length>0&&<><h3 className="subhead">Potential skill gaps</h3><div className="chips muted-chips">{analysis.missing.map(s=><span key={s}>{s}</span>)}</div></>}</section></>}
  </Page>
}

function JobsPage({analysis}) {
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);

  const dataExample = `Data Analyst Intern

We are looking for a Data Analyst Intern who can work with Python, SQL, Excel and Power BI. The candidate should understand data analysis, statistics and data visualization. Experience with Pandas and Tableau is a plus. Strong communication and problem-solving skills are expected.`;

  const mlExample = `Junior Machine Learning Engineer

Requirements: Python, SQL, Pandas, NumPy, Scikit-learn and machine learning fundamentals. Experience with Git, Docker and AWS is preferred. Candidates should understand model evaluation, data preprocessing and deployment workflows.`;

  function calculate() {
    if (analysis && jd.trim().length >= 30) setResult(matchResumeToJD(analysis.rawText, jd));
  }

  return <Page title="Job Matching" subtitle="Paste a real job description and compare it against your uploaded resume.">
    {!analysis ? (
      <div className="empty-hero panel"><BriefcaseBusiness size={23}/><div><b>Upload a resume first</b><span>CareerLens needs your detected skills before it can compare your profile with a job description.</span></div></div>
    ) : <>
      <section className="panel jd-panel">
        <div className="panel-title">
          <div><h2>Compare with a Job Description</h2><p className="panel-subtitle">CareerLens compares skills, keywords, education and experience signals.</p></div>
          <span className="local-badge">LOCAL ANALYSIS</span>
        </div>
        <textarea className="jd-textarea" value={jd} onChange={e=>{setJd(e.target.value);setResult(null)}} placeholder="Paste the complete job description here..."/>
        <div className="jd-actions">
          <div className="example-actions">
            <button className="secondary" onClick={()=>setJd(dataExample)}>Data Analyst example</button>
            <button className="secondary" onClick={()=>setJd(mlExample)}>ML example</button>
          </div>
          <button className="primary" disabled={jd.trim().length < 30} onClick={calculate}><Target size={16}/> Calculate Match</button>
        </div>
      </section>

      {!result ? (
        <div className="match-placeholder panel"><Target size={24}/><div><b>Your job match will appear here</b><span>Paste a job description and click Calculate Match.</span></div></div>
      ) : <>
        <div className="match-result-hero panel">
          <div><p className="eyebrow">JOB MATCH RESULT</p><h2>{result.verdict}</h2><p>{result.matched.length} of {result.jdSkills.length} detected skills matched your resume.</p></div>
          <div className="result-score">{result.fit}<span>% match</span></div>
        </div>

        <div className="stats-grid three">
          <Stat title="Overall Match" value={result.fit} suffix="%" change={result.verdict}/>
          <Stat title="Skill Match" value={result.skillScore} suffix="%" change={`${result.matched.length}/${result.jdSkills.length} skills`}/>
          <Stat title="Keyword Coverage" value={result.keywordCoverage} suffix="%" change={`${result.matchedTerms.length} terms found`}/>
        </div>

        <div className="dashboard-grid">
          <section className="panel"><PanelTitle title="Matched Skills"/><div className="chips">{result.matched.length ? result.matched.map(s=><span className="skill-match" key={s}><CheckCircle2 size={12}/>{s}</span>) : <p className="muted">No matching skills detected.</p>}</div></section>
          <section className="panel"><PanelTitle title="Missing Skills"/><div className="chips">{result.missing.length ? result.missing.map(s=><span className="skill-missing" key={s}><AlertCircle size={12}/>{s}</span>) : <p className="muted">No obvious skill gaps from the built-in dictionary.</p>}</div></section>
        </div>

        <div className="dashboard-grid">
          <section className="panel"><PanelTitle title="Why this score?"/><Metric name="Skill alignment" value={result.skillScore}/><Metric name="Keyword coverage" value={result.keywordCoverage}/><div className="explanation-note"><Sparkles size={16}/><span>CareerLens also checks education and experience signals when the job description asks for them.</span></div></section>
          <section className="panel"><PanelTitle title="Recommendations"/>{result.recommendations.map((r,i)=><HealthItem key={i} icon={<Sparkles/>} title={`Recommendation ${i+1}`} text={r} good/>)}</section>
        </div>
      </>}
    </>}
  </Page>
}

function Job({name,company,match,skills}){return <div className="job-item"><div className="company-logo">{company.slice(0,1)}</div><div className="job-info"><b>{name}</b><span>{company}</span><small>{skills}</small></div><strong className="match">{match}</strong></div>}

function CareerPage({analysis}) {
  const [activeModal, setActiveModal] = useState(null);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [reAnalyzing, setReAnalyzing] = useState(false);
  if (!analysis) return <Page title="Career Advisor" subtitle="Personalized guidance to help you plan your next career move.">
    <div className="empty-hero panel"><Compass size={23}/><div><b>Analyze a resume to unlock Career Advisor</b><span>CareerLens will use your detected skills and resume gaps to build personalized career paths.</span></div></div>
  </Page>;

  const skillSet = analysis.skills.map(s => s.toLowerCase());
  const has = s => skillSet.includes(s);
  const paths = [
    {
      title:"Data Analyst", icon:"📈", fit: Math.min(96, Math.max(65, analysis.jobMatch + 5)),
      badge:"Best Match", badgeClass:"best",
      desc:"Analyze data to help organizations make better decisions.",
      growth:"High", demand:"High"
    },
    {
      title:"Junior Data Scientist", icon:"🧠", fit: Math.min(94, Math.max(60, analysis.jobMatch)),
      badge:"Great Match", badgeClass:"great",
      desc:"Build models and extract insights from complex data.",
      growth:"High", demand:"High"
    },
    {
      title:"Machine Learning Engineer", icon:"☁", fit: Math.min(88, Math.max(50, analysis.jobMatch - 10)),
      badge:"Good Match", badgeClass:"good",
      desc:"Design and deploy machine learning models in production.",
      growth:"High", demand:"Medium"
    }
  ];

  const priorities = [
    ["sql", "SQL", has("sql") ? 72 : 34, "High Priority", "purple"],
    ["power bi", "Power BI", has("power bi") ? 68 : 28, "High Priority", "gold"],
    ["statistics", "Statistics", has("statistics") ? 62 : 40, "Medium Priority", "green"],
    ["excel", "Advanced Excel", has("excel") ? 58 : 25, "Medium Priority", "green"],
    ["aws", "AWS", has("aws") ? 45 : 18, "Low Priority", "gold"]
  ];

  const improvements = analysis.warnings.length;
  const strengths = analysis.strengths.length + Math.min(analysis.skills.length, 4);
  const topFit = paths[0].fit;

  return <Page title="Career Advisor ✨" subtitle="Personalized guidance to help you achieve your career goals.">
    <div className="career-toolbar"><div></div><button className="secondary" onClick={()=>{setReAnalyzing(true);setTimeout(()=>setReAnalyzing(false),900)}} disabled={reAnalyzing}><TrendingUp size={14}/> {reAnalyzing?"Analyzing...":"Re-analyze Resume"}</button></div>

    <div className="career-stats">
      <div className="career-stat panel"><div className="career-stat-head"><span>Overall Fit Score</span><span className="round-icon purple"><TrendingUp size={16}/></span></div><strong>{topFit}%</strong><div className="career-progress"><i style={{width:`${topFit}%`}}/></div><p>Good fit for your top career paths</p></div>
      <div className="career-stat panel"><div className="career-stat-head"><span>Top Strengths</span><span className="round-icon green"><CheckCircle2 size={16}/></span></div><strong>{strengths}</strong><p>Strong skills and qualities identified</p></div>
      <div className="career-stat panel"><div className="career-stat-head"><span>Areas to Improve</span><span className="round-icon gold"><AlertCircle size={16}/></span></div><strong className="gold-text">{improvements}</strong><p>Key areas to focus on for better opportunities</p></div>
      <div className="career-stat panel"><div className="career-stat-head"><span>Career Paths</span><span className="round-icon blue"><BriefcaseBusiness size={16}/></span></div><strong className="blue-text">3</strong><p>Recommended career paths for you</p></div>
    </div>

    <div className="career-layout">
      <section className="panel career-paths">
        <div className="panel-title"><div><h2>✦ Recommended Career Paths</h2><p className="panel-subtitle">Based on your skills, experience and current profile</p></div></div>
        {paths.map((p,i)=><div className="career-path-card" key={p.title}>
          <div className={`path-icon path-${i}`}>{p.icon}</div>
          <div className="path-main"><div className="path-title"><h3>{p.title}</h3><span className={`path-badge ${p.badgeClass}`}>{p.badge}</span></div><p>{p.desc}</p><div className="path-meta"><span><b>Fit Score</b><strong>{p.fit}%</strong></span><span><b>Growth</b><strong>{p.growth}</strong></span><span><b>Demand</b><strong>{p.demand}</strong></span></div></div>
          <button className="secondary roadmap-btn" onClick={()=>setActiveModal({type:"roadmap", title:p.title})}>View Roadmap <ChevronRight size={13}/></button>
        </div>)}
        <button className="explore-paths" onClick={()=>setActiveModal({type:"paths", title:"More Career Paths"})}>Explore More Career Paths <ChevronRight size={15}/></button>
      </section>

      <div className="career-right">
        <section className="panel focus-panel">
          <div className="panel-title"><div><h2>◉ Skills to Focus On</h2><p className="panel-subtitle">Skills that will boost your career prospects</p></div><button className="link-btn" onClick={()=>setShowAllSkills(v=>!v)}>{showAllSkills?"Show Less":"View All"}</button></div>
          {(showAllSkills ? [...priorities, ...analysis.missing.slice(0,6).map((name,i)=>[name,name,Math.max(12,55-i*7),"Potential Gap",i%2?"green":"purple"])] : priorities).map(([key,name,value,priority,kind])=><div className="focus-skill" key={name}><div className={`skill-symbol ${kind}`}>{key==="sql"?"▤":key==="power bi"?"▥":key==="statistics"?"Σ":key==="excel"?"▣":"AWS"}</div><div className="focus-main"><div><b>{name}</b><strong className={priority.includes("High")?"high":priority.includes("Medium")?"medium":"low"}>{priority}</strong></div><div className="progress"><i style={{width:`${value}%`}}/></div></div></div>)}
        </section>

        <div className="career-bottom">
          <section className="panel quick-insights"><div className="panel-title"><h2>💡 Quick Insights</h2></div>
            {[
              analysis.skills.length >= 5 ? "Your technical skills are a strong asset." : "Build a stronger technical skill foundation.",
              analysis.quantified >= 2 ? "Your resume uses measurable achievements." : "Add more measurable achievements to your resume.",
              "Work on projects related to your target career path.",
              "Certifications in SQL, Power BI or cloud can strengthen your profile."
            ].map((x,i)=><div className="insight" key={i}><CheckCircle2 size={14}/><span>{x}</span></div>)}
          </section>
          <section className="panel roadmap-card"><div><h2>▱ Your Career Roadmap</h2><p>Step-by-step plan to reach your goals</p><button className="secondary" onClick={()=>setActiveModal({type:"roadmap", title:"Your Career Roadmap"})}>View Roadmap <ChevronRight size={13}/></button></div><div className="roadmap-art">⌁<br/>↗</div></section>
        </div>
      </div>
    </div>
  </Page>
}

function Road({n,title,text,done}){return <div className="road"><div className={done?"road-num done":"road-num"}>{done?<CheckCircle2 size={17}/>:n}</div><div><b>{title}</b><span>{text}</span></div></div>}

function AnalyticsPage({analysis}) {
  return <Page title="Analytics" subtitle="Track the current resume profile and analysis signals.">
    {!analysis?<div className="empty-hero panel"><BarChart3 size={23}/><div><b>No analysis history yet</b><span>Upload a resume to generate your first real analytics snapshot.</span></div></div>:<><div className="stats-grid three"><Stat title="Resume score" value={analysis.score} suffix="/100" change="Current analysis"/><Stat title="ATS score" value={analysis.ats} suffix="/100" change="Current analysis"/><Stat title="Detected skills" value={analysis.skills.length} suffix="" change={`${analysis.words} words analyzed`}/></div><section className="panel"><PanelTitle title="Current analysis breakdown"/><div className="metric-bars"><Metric name="Resume score" value={analysis.score}/><Metric name="ATS score" value={analysis.ats}/><Metric name="Keyword coverage" value={analysis.keywordCoverage}/><Metric name="Technical skill coverage" value={Math.min(95,analysis.skills.length*5)}/></div></section></>}
  </Page>
}
function Metric({name,value}){return <div className="metric"><div><span>{name}</span><b>{value}%</b></div><div className="progress"><i style={{width:`${value}%`}}/></div></div>}

function SettingsPage(){return <Page title="Settings" subtitle="Manage your CareerLens preferences."><section className="panel settings"><Setting title="Profile visibility" text="Allow CareerLens to personalize job recommendations."/><Setting title="Resume history" text="Keep previous resume analyses for comparison."/><Setting title="Smart recommendations" text="Show personalized career insights on your dashboard."/></section></Page>}
function Setting({title,text}){return <div className="setting"><div><b>{title}</b><span>{text}</span></div><div className="toggle on"><i/></div></div>}
function Page({title,subtitle,children}){return <><section className="page-heading"><p className="eyebrow">CAREERLENS</p><h1>{title}</h1><p>{subtitle}</p></section>{children}</>}

createRoot(document.getElementById("root")).render(<App />);
