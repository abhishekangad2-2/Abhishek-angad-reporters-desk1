#!/usr/bin/env python3
"""Parse Abhishek Angad's article PDFs (Indian Express / Hindustan Times web
saves) into structured archive entries. Outputs archive_data.json + a report.
No external deps beyond the `pdftotext` CLI."""
import os, re, json, subprocess, html, sys
from datetime import datetime

DESK = "/Users/abhishekangad/Desktop/MARCH 3/ECI stories "
DL = "/Users/abhishekangad/Downloads"
FOLDERS = {
    "Elections (ECI)": DESK,
    "Profiles": f"{DL}/profiles",
    "Policy": f"{DL}/Policy",
    "Criminal Justice": f"{DL}/Long forms criminal justice system",
    "Climate": f"{DL}/Climate Crisis- Unplanned closure of mines",
    "Investigations": f"{DL}/Investigations",
    "Political Reporting": f"{DL}/political reporting _24",
    "Health": f"{DL}/Health stories ",
    "Mob Violence": f"{DL}/mob violence stories ",
}

def pdftext(path):
    try:
        return subprocess.run(["pdftotext", "-q", path, "-"], capture_output=True, text=True, timeout=60).stdout
    except Exception:
        return ""

def clean_title(fn):
    t = os.path.splitext(fn)[0]
    # decode the &#NNNN_ pseudo-entities in filenames
    t = re.sub(r"&#(\d+)_?", lambda m: chr(int(m.group(1))), t)
    t = html.unescape(t)
    # strip trailing outlet/section junk
    t = re.split(r"\s*[_|]\s*(Political Pulse|Political Pulse News|The Indian Express|Hindustan Times|India News|Cities|Explained|News).*$", t)[0]
    return re.sub(r"\s+", " ", t).strip(" _-")

def slugify(t):
    s = re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
    return s[:80].strip("-")

def find_outlet(txt, fn, cat):
    blob = (txt[:8000] + " " + fn).lower()
    if "hindustan times" in blob or "hindustantimes" in blob: return "Hindustan Times"
    if ("indian express" in blob or "indianexpress" in blob
            or "political pulse" in blob or "express photo" in blob
            or "journalism of courage" in blob): return "The Indian Express"
    return "Unknown"

def infer_year(txt, path, cat, date):
    if date: return date[:4]
    # strong folder/beat signals
    if cat == "Political Reporting": return "2024"   # folder "political reporting _24"
    if cat == "Elections (ECI)": return "2025"       # Bihar/WB SIR were 2025
    # else: year of the PDF file (when saved ~ near publish); labelled approximate
    try:
        return str(datetime.fromtimestamp(os.path.getmtime(path)).year)
    except Exception:
        return None

MONTHS = {m:i for i,m in enumerate(
    ["january","february","march","april","may","june","july","august",
     "september","october","november","december"], 1)}

def find_date(txt):
    # "First published on: 17-07-2022"
    m = re.search(r"First published on:\s*(\d{2})-(\d{2})-(\d{4})", txt)
    if m: return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    # "Updated: July 25, 2022"
    m = re.search(r"(?:Updated|Published):?\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})", txt)
    if m and m.group(1).lower() in MONTHS:
        return f"{m.group(3)}-{MONTHS[m.group(1).lower()]:02d}-{int(m.group(2)):02d}"
    return None

CRUFT = re.compile(
    r"^\s*(TRENDING|ADVERTISEMENT|ALSO READ|Also Read|Written by|Updated:|Published:|"
    r"First published|Photo by|Express Photo|SUBSCRIBERS|Subscribe|Trending News|"
    r"©|Sections|Newsletters|JOURNALISM OF COURAGE|ePaper|Home|Get Access|"
    r"Follow|Tags:|Read in|Click here|Download|More from|Next Story|Previous Story)", re.I)

# A junk BLOCK (trending widget / ad / related-links) starts at one of these
# markers and runs until the next "N ago" timestamp or a blank line.
BLOCK_START = re.compile(
    r"^(LIVE BLOG|BEST OF EXPRESS|MOST READ|MOST POPULAR|TRENDING|ADVERTISEMENT|AD|Share|"
    r"Watch on|Follow Us|Premium|CITIES|ENTERTAINMENT|OPINION|SPORTS|POLITICS|BUSINESS|"
    r"TECH(NOLOGY)?|LIFESTYLE|EXPLAINED|WORLD|INDIA|EDUCATION|Newsletters?|Sections|"
    r"Written by|Updated|Published|First published|Listen to this|Story continues)", re.I)
# Sentence-level junk (trending headlines that got split across lines and
# rejoined slip past the line filter — catch them on the reassembled text).
JUNK_SENT = re.compile(
    r"live updates?|live score|live blog|movie review|full scorecard|watch on|"
    r"best of express|trending now|full detail|click here|subscribe|"
    r"\bIND vs\b|\bvs WI\b|monsoon session live|mission live", re.I)
BLOCK_LINE = re.compile(
    r"₹|\brs\.?\s*\d|insurance|eligibilit|@\s*₹|/mon\b|term life|maxlife|"
    r"live (updates?|score|blog|coverage)|movie review|scorecard|"
    r"^\s*\|\s*$|^Opinion \||^Also Read|subscribe|download the app|"
    r"click here|photo gallery|sign in|^\s*AD\s*$", re.I)
TS = re.compile(r"^\s*\d+\s+(sec|min|minute|hour|day|week|month|year)s?\s+ago\s*$", re.I)
CAPTION = re.compile(r"^\(?(Illustration|Express Photo|Photo|Image|Source|File Photo|PTI|Representative|Reuters)", re.I)

def clean_body(txt):
    lines = txt.splitlines()
    # find byline start
    start = 0
    for i,l in enumerate(lines):
        if re.match(r"\s*Written by", l): start = i+1; break
    # find end — only true footer markers (widgets like BEST OF EXPRESS recur
    # mid-article, so must NOT be treated as the end)
    end = len(lines)
    for i in range(start, len(lines)):
        if re.search(r"© The Indian Express|SUBSCRIBERS READING NOW|Stay updated with the latest", lines[i]):
            end = i; break
    # Collect article fragments (blanks here are junk-induced, NOT real
    # paragraph breaks — the web-save fragments the prose around widgets).
    buf, skip = [], False
    for l in lines[start:end]:
        s = l.strip()
        if not s: skip = False; continue
        if TS.match(s): skip = False; continue          # "N hours ago" closes a block
        if BLOCK_START.match(s) or BLOCK_LINE.search(s) or CAPTION.match(s) \
           or s == "Story continues below this ad":
            skip = True; continue
        if skip: continue
        if len(s) < 25 and (s.isupper() or s.count(" ") <= 1): continue
        buf.append(s)
    text = re.sub(r"\s+", " ", " ".join(buf)).strip()
    # Re-paragraph: split into sentences, group ~3–4 per paragraph for reading.
    sents = re.split(r"(?<=[.?!”\"])\s+(?=[A-Z“\"])", text)
    paras, cur = [], []
    for sent in sents:
        if JUNK_SENT.search(sent): continue           # drop leaked trending headlines
        cur.append(sent)
        if len(" ".join(cur)) > 380:
            paras.append(" ".join(cur)); cur = []
    if cur: paras.append(" ".join(cur))
    return "\n\n".join(paras)

def find_dek(txt):
    lines = txt.splitlines()
    for i,l in enumerate(lines):
        if re.match(r"\s*Written by", l):
            # dek is usually the non-empty line shortly before the byline
            for j in range(i-1, max(0,i-6), -1):
                s = lines[j].strip()
                if len(s) > 40 and not CRUFT.match(s): return s
    return ""

# pieces that aren't Angad's reportage (saved for reference) — exclude
EXCLUDE = re.compile(r"hyrox|fitness fanatic", re.I)

entries, report, seen = [], [], set()
for cat, folder in FOLDERS.items():
    if not os.path.isdir(folder):
        report.append((cat, "MISSING FOLDER", "", 0)); continue
    # recurse — some beats (Investigations) keep PDFs in subfolders
    pdfpaths = []
    for root, _dirs, files in os.walk(folder):
        for fn in files:
            if fn.lower().endswith(".pdf"): pdfpaths.append(os.path.join(root, fn))
    for path in sorted(pdfpaths):
        fn = os.path.basename(path)
        txt = pdftext(path)
        title = clean_title(fn)
        if EXCLUDE.search(title): continue
        slug = slugify(title)
        if slug in seen: continue      # dedupe
        seen.add(slug)
        outlet = find_outlet(txt, fn, cat)
        outlet_inferred = False
        if title.strip().upper() == "WB SIR":
            outlet = ""                # user: no attribution
        elif outlet == "Unknown":
            outlet = "The Indian Express"   # his primary beat; verify in CMS
            outlet_inferred = True
        date = find_date(txt)
        year = infer_year(txt, path, cat, date)
        body = clean_body(txt)
        dek = find_dek(txt)
        byline_ok = bool(re.search(r"Abhishek Angad", txt))
        flags = []
        if not date: flags.append("NO-DATE")
        if len(body) < 400: flags.append("SHORT-BODY(%d)"%len(body))
        if outlet == "Unknown": flags.append("NO-OUTLET")
        if not byline_ok: flags.append("NO-BYLINE")
        entries.append({
            "category": cat, "title": title, "slug": slug,
            "outlet": outlet, "outlet_inferred": outlet_inferred,
            "date": date, "year": year, "date_exact": bool(date), "dek": dek,
            "body_chars": len(body), "body": body, "source_file": fn,
        })
        report.append((cat, title[:52], outlet, date or "—", ",".join(flags)))

out = "/private/tmp/claude-501/-Users-abhishekangad-Desktop-Claude-ai/c23d635b-c766-49c5-a790-cf98cb5d1911/scratchpad/archive_data.json"
json.dump(entries, open(out,"w"), indent=1, ensure_ascii=False)

# ---- report ----
print(f"TOTAL PARSED: {len(entries)} articles\n")
from collections import Counter
print("By category:", dict(Counter(e['category'] for e in entries)))
print("By outlet:  ", dict(Counter(e['outlet'] for e in entries)))
flagged = [r for r in report if r[4]]
print(f"\nFLAGGED (need review): {len(flagged)} / {len(entries)}")
for cat,title,outlet,date,flags in flagged[:40]:
    print(f"  [{flags:22}] {date:10} {outlet[:3]:3} · {title}")
print(f"\nJSON → {out}")
