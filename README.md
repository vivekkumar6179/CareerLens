# CareerLens — Real Resume Analysis (v1.1)

CareerLens is a React + Vite frontend prototype that now performs **real local resume extraction and rule-based analysis**.

## What changed
- PDF text extraction using `pdfjs-dist`
- DOCX text extraction using `mammoth`
- No placeholder scores after upload
- Resume score calculated from actual resume content
- ATS score based on sections, keywords and resume signals
- Skills detected from the extracted text
- Resume section detection
- Measurable-achievement and action-verb checks
- Dynamic dashboard, job matching, career roadmap and analytics
- Empty dashboard before upload instead of fake scores
- No resume file is uploaded to a server by this version; analysis happens in the browser

## Run

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Supported files
- `.pdf`
- `.docx`

For scanned/image-only PDFs, text extraction may return little or no text. Use a text-based PDF or DOCX.

## Important
The current scoring engine is **rule-based**, not an LLM. It is real/dynamic but intentionally simple and explainable. An OpenAI/Gemini/local-LLM backend can be added later for semantic recommendations and stronger job-description matching.


## v1.2 — Job Description Matching

Paste a real job description and CareerLens compares it with the uploaded resume using detected skills, keyword coverage, education/experience signals, missing skills, an overall match score, and recommendations. Analysis remains local and rule-based in this version.


## v1.3 — Career Advisor redesign
- Removed the CareerLens Pro / Upgrade card.
- Redesigned Career Advisor with fit score, strengths, improvement areas, career paths, skill priorities, quick insights and roadmap.
- Career Advisor remains dynamic based on the analyzed resume.


## v1.4 — Career Advisor interactions
- Re-analyze Resume button now gives an active analysis state.
- View Roadmap buttons open a functional roadmap modal.
- Explore More Career Paths opens a list of additional roles.
- Skills View All expands the focus list and Show Less collapses it.
- Roadmap card button is functional.
