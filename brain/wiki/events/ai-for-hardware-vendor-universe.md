# AI / Software-for-Hardware — Vendor Universe (Proving-Ground Event)

scope: event/sponsor-prospects · created: 2026-06-13 · author: Kerri (Claude interactive, 7-agent web sweep) · status: research master list

Master vendor universe for Brian's proposed **"proving ground"** event: a curated, hands-on demo floor where senior technical buyers (VP Eng, Director of Manufacturing, Head of Hardware, CTOs) go station-to-station and actually touch software/AI-for-hardware tools to separate signal from noise. Theme spans the full software-for-hardware stack with the **AI-native layer** as the hot center. Built from a 7-agent parallel web sweep (~350 vendors). Pure component distributors and pure offline contract manufacturers excluded unless they have a demoable software platform.

**Legend:**
- CRM status: **✅** = existing HWFYI relationship/registered (pre-2026-06-13) · **🆕** = registered 2026-06-13 in the CY2026 gap-close batch (H0183–H0202, see [[../workflows/hwfyi-cy2026-gap-close-targets]]) · **⚪** = net-new, not yet in CRM
- Type: AI = AI-native · Inc = Incumbent · Hyb = Hybrid
- Demo = hands-on fit at a 20-min station (High/Med/Low)
- Bay = SF/Bay Area HQ (easiest to recruit for an SF event)

Line format: **Name** (domain) — what it does · Type · stage/funding · HQ · Demo · CRM

---

## LANE 1 — CAD & Mechanical Design (incl. AI-CAD, generative, additive software)

### Established CAD/CAM
- **Dassault SOLIDWORKS** (solidworks.com) — reference parametric mech CAD/CAM, adding Aura AI · Inc · Public · France/Waltham · High · ⚪ (Saratech/VIAS3D resellers are ✅)
- **Dassault CATIA** (3ds.com) — high-end aero/auto CAD · Inc · Public · France · Med · ⚪
- **Siemens NX** (siemens.com) — high-end CAD/CAM/CAE + Design Copilot · Inc · Public · Plano TX · Med · ✅ (Siemens DI H0103)
- **Siemens Solid Edge** (sw.siemens.com) — mainstream CAD + AI Design Copilot · Hyb · Public · Plano TX · High · ✅ (Siemens DI)
- **PTC Creo** (ptc.com) — parametric CAD + generative · Hyb · Public · Boston · Med-High · ✅ (PTC H0104)
- **Autodesk Fusion** (autodesk.com) — cloud CAD/CAM/CAE + generative + Fusion AI · Hyb · Public · **Bay** · High · 🆕 (Autodesk H0199)
- **Autodesk Inventor** (autodesk.com) — desktop mech CAD · Inc · Public · Bay · Med · 🆕 (Autodesk)
- **PTC Onshape** (onshape.com) — full cloud browser CAD + AI Advisor + built-in PDM · Hyb · Public · Boston · High · ✅ (Onshape H0105)
- **Shapr3D** (shapr3d.com) — fast iPad/Mac direct-modeling CAD · Hyb · ~$30M+ · Budapest · High · ⚪
- **Rhino / Grasshopper** (rhino3d.com) — NURBS + computational design · Inc · Private · Seattle · High · ⚪
- **IronCAD** (ironcad.com) — hybrid direct/parametric CAD · Inc · Private · Atlanta · Med · ⚪
- **ZW3D** (zwsoft.com) — mid-market CAD/CAM · Inc · Private · China · Med · ⚪
- **Bricsys** (bricsys.com) — DWG-native CAD + AI (Hexagon) · Hyb · Public · Belgium · Med · ⚪
- **Ansys Discovery/SpaceClaim** (ansys.com) — direct modeling + sim-driven · Inc · Public(Synopsys) · PA · Med · 🆕 (Ansys H0202)
- **Mastercam** (mastercam.com) — CAM standard · Inc · Private · MA · Med · ✅ (H0172)
- **Synera** (synera.io) — low-code engineering automation/generative workflows · Hyb · VC · Germany · Med · ✅ (H0108)

### Generative / Topology / Computational
- **nTop** (ntop.com) — implicit/field-driven generative + lattices + topology · Hyb · ~$135M+ · NYC · High · ✅ (H0152)
- **Hyperganic** (hyperganic.com) — algorithmic/AI voxel generative ("engineering as code") · AI · VC · Munich · Med · ⚪
- **Diabatix ColdStream** (diabatix.com) — AI generative thermal/cooling design · AI · VC · Belgium · High · ⚪
- **Additive Flow** (additiveflow.com) — multi-objective generative for AM · AI · Seed · London · Med · ⚪
- **Hexagon MSC Apex Generative** (hexagon.com) — topology for lightweighting · Inc · Public · Sweden · Med · ⚪

### AI-Native CAD (text/image/scan-to-CAD, copilots, agents) — the hot zone
- **Adam / AdamCAD** (adam.new) — text-to-CAD parametric + copilot for Onshape/Fusion/SW · AI · Seed $4.1M (YC W25) · **Bay** · High · ⚪
- **Zoo / KittyCAD** (zoo.dev) — open-source text-to-CAD + Design Studio + ML CAD API · AI · VC (Sequoia) · LA · High · ⚪
- **Leo AI** (getleo.ai) — engineering design copilot, prompt→assemblies · AI · VC · Boston/Tel Aviv · High · ⚪
- **Hestus** (hestus.co) — AI copilot auto-constraining sketches in Fusion · AI · Seed $1.5M (YC) · **Bay** · High · ⚪
- **MecAgent** (mecagent.com) — autonomous AI agent for mech CAD (SW/Creo/Fusion) · AI · Seed $3M · **Bay** · High · ⚪
- **Backflip AI** (backflip.ai) — text/image/3D-scan→printable CAD; SW plugin · AI · Series A $30M (NEA, a16z) · Cambridge MA · High · 🆕 (H0185)
- **DraftAid** (draftaid.io) — AI auto-generates 2D fab drawings from 3D · AI · Seed (YC) · Adelaide AU · High · ⚪
- **CADDi** (caddi.com) — AI drawing-data/part-search platform · AI · Series C $228M+ (unicorn) · Tokyo/Chicago · Med · ⚪
- **Bild AI** (bild.ai) — AI reads CAD/PDF drawings → materials/cost/compliance · AI · Seed $3.1M (Khosla, YC) · **Bay** · Med · ⚪
- **CADGPT** (cadgpt.com) — context-aware CAD chat assistant (AutoLISP/Python) · AI · early · US · Med · ⚪
- **Makistry** (makistry.com) — text-to-CAD parametric · AI · seed · US · Med · ⚪
- **Spline / Spline AI** (spline.design) — browser 3D + prompt-to-3D · AI · VC · **Bay** · Med · ⚪
- **Sloyd** (sloyd.ai) — procedural/AI web 3D, print-ready STL · AI · seed · Iceland/US · Med · ⚪

### Additive / 3D-Printing Software (build prep, DfAM, slicing, workflow)
- **Materialise Magics / CO-AM** (materialise.com) — AM data/build-prep + workflow standard · Inc · Public · Belgium · High · ⚪
- **Oqton (3DXpert)** (oqton.com) — DfAM/build-prep + AI MFG OS (Dassault) · Hyb · Public · Ghent/SF · High · ⚪
- **Markforged Eiger** (markforged.com) — cloud slicer/print mgmt · Inc · Public · Waltham MA · High · 🆕 (H0197)
- **Dyndrite** (dyndrite.com) — GPU-accelerated AM build prep + scripting · Hyb · VC · Seattle · Med · ⚪
- **Authentise** (authentise.com) — AM workflow automation/MES · Hyb · VC · **Bay** (Mtn View) · Med · ⚪
- **Carbon Design Engine** (carbon3d.com) — generative lattice for DLS printing · Hyb · $680M+ · **Bay** (Redwood City) · High · ⚪
- **Velo3D Flow** (velo3d.com) — print-prep for Velo3D metal · Hyb · Public · **Bay** (Fremont) · Med · ⚪
- **CASTOR** (castor3d.io) — AI identifies AM-suitable parts + cost/CO2 · AI · VC · Tel Aviv · High · ⚪
- **3YOURMIND** (3yourmind.com) — AM workflow/MES + part ID · Hyb · VC · Berlin · Med · ⚪
- **3D Systems 3D Sprint/3DXpert** (3dsystems.com) — build prep · Inc · Public · SC · Med · ⚪
- **GrabCAD Print (Stratasys)** (grabcad.com) — slicing/print mgmt + library · Inc · Public · Boston · High · ⚪
- **3DPrinterOS** (3dprinteros.com) — cloud print mgmt/fleet/failure-detection · Hyb · VC · **Bay** (Cupertino) · High · ⚪
- **Fabpilot** (fabpilot.com) — cloud AM software (BASF/Sculpteo) · Hyb · Corp · Paris · Med · ⚪
- **Formlabs (software)** (formlabs.com) — PreForm/Dashboard for SLA/SLS · Inc · Private · Boston · High · ✅ (H0107)
- **Nano Dimension** (nano-di.com) — additive electronics/metal · Inc · Public · Israel/US · Med · ✅ (H0135)

---

## LANE 2 — Simulation & CAE (incl. AI-native physics)

### Incumbent multiphysics
- **Ansys** (ansys.com) — multiphysics leader (Mechanical/Fluent/HFSS) + SimAI · Inc/Hyb · Public(Synopsys) · PA · High · 🆕 (H0202)
- **Altair** (altair.com) — optimization-first CAE + physicsAI/romAI · Inc/Hyb · Public(Siemens) · Troy MI · High · ⚪
- **COMSOL** (comsol.com) — single-tree coupled multiphysics · Inc · Private · Stockholm/Burlington · High · ⚪
- **Siemens Simcenter (STAR-CCM+)** (sw.siemens.com) — full CAE, CFD flagship · Inc/Hyb · Public · Plano · Med · ✅ (Siemens DI)
- **Dassault SIMULIA (Abaqus/CST)** (3ds.com/simulia) — nonlinear FEA + EM · Inc · Public · France · Med · ⚪ (VIAS3D reseller ✅)
- **Hexagon/MSC (Nastran/Adams/Cradle)** (hexagon.com) — FEA/multibody/CFD · Inc · Public · Sweden · Med · ⚪
- **ESI Group** (esi-group.com) — virtual prototyping/crash (Keysight-owned) · Inc · Public(Keysight) · Paris · Low · ⚪
- **Esteco (modeFRONTIER)** (esteco.com) — DOE/optimization over CAE · Inc · Private · Italy · Med · ⚪
- **Cadence Fidelity/Pointwise/Celsius** (cadence.com) — CFD/meshing/thermal · Inc · Public · **Bay** (San Jose) · Med · 🆕 (Cadence H0200)
- **Convergent Science (CONVERGE)** · **Flow Science (FLOW-3D)** · **Remcom** · **Sonnet** — niche CFD/EM incumbents · Inc · Low-Med · ⚪

### Cloud-native / on-demand
- **SimScale** (simscale.com) — browser CFD/FEA/thermal + Physics AI · Hyb · VC · Munich · High · 🆕 (H0191)
- **Rescale** (rescale.com) — cloud HPC + sim orchestration + surrogates · Hyb · $100M+ · **Bay** · Med · ⚪
- **OnScale** (onscale.com) — cloud multiphysics (MEMS/sensors) · Cloud · VC(Ansys orbit) · **Bay** (Cupertino) · Med · ⚪
- **Luminary Cloud** (luminary.ai) — cloud physics + AI/ML; NVIDIA Apollo partner · Hyb/AI · well-funded (Sutter Hill) · **Bay** · High · ⚪
- **CAEplex** (caeplex.com) — lightweight browser FEA · Cloud · indie · Spain · Med · ⚪
- **Bramble CFD** (bramblecfd.com) — cloud CFD · Cloud · early · UK · Med · ⚪

### AI-native surrogate / physics-ML (headline category)
- **PhysicsX** (physicsx.ai) — large physics models, AI surrogates (LGM-Aero) · AI · ~$300M (Series C) · London · High · 🆕 (H0183)
- **Neural Concept** (neuralconcept.com) — 3D geometric deep-learning surrogates linked to CAD/CAE · AI · $100M Series C (Goldman) · Switzerland · High · ✅ (H0024)
- **Monolith AI** (monolith.ai) — AI on real test data to cut physical validation · AI · VC · London · High · ⚪
- **Vinci / Vinci4D** (getvinci.ai) — physics foundation model, up to 1000x · AI · $46M (Xora, Eclipse) · **Bay** · Med-High · ⚪
- **Godela** (godela.ai) — physics foundation model, solver-level in seconds · AI · YC S25 seed · **Bay** · High · ⚪
- **Inviscid AI** (inviscidai.com) — PINN real-time CFD · AI · YC W26 seed · US · High · ⚪
- **Modelwise** (modelwise.ai) — modeling/simulation tooling · AI · VC · — · Med · ✅ (H0023, package quote in flight)
- **DimensionLab/Siml.ai** · **Navasto** · **Quaisr** · **Inductiva** · **Navier AI** (navier.ai, $5.6M seed GV/YC) · **Basetwo** — surrogate/PINN/agentic-sim · AI · seed/early · mixed · Med · ⚪
- **NVIDIA PhysicsNeMo/Apollo** (developer.nvidia.com) — open physics-ML substrate powering many above · Enabler · Public · **Bay** (Santa Clara) · Med · ⚪ (possible anchor)

---

## LANE 3 — EDA & Electronics / PCB Design (incl. AI-EDA, component data)

### Chip EDA "Big 3"
- **Cadence** (cadence.com) — full-stack IC/PCB EDA + Cerebrus/JedAI/ChipStack · Inc · Public · **Bay** (San Jose) · Med · 🆕 (H0200)
- **Synopsys** (synopsys.com) — EDA+IP leader + DSO.ai/Synopsys.ai Copilot · Inc · Public · **Bay** (Sunnyvale) · Med · ⚪ (gap-close bench)
- **Siemens EDA (Mentor)** (sw.siemens.com) — Xpedition/PADS/Calibre/HyperLynx/Solido · Inc · Public · Oregon · Med · ✅ (Siemens DI)

### PCB / Schematic / Layout
- **Altium** (altium.com) — Altium Designer + 365 cloud + Octopart/Nexar (now Renesas) · Inc · Public · San Diego · Med · ✅ (H0171)
- **Zuken** (zuken.com) — CR-8000/CADSTAR enterprise PCB · Inc · Public · Japan · Low · ⚪
- **KiCad** (kicad.org) — free OSS schematic+PCB, huge install base · Inc/OSS · Nonprofit · — · Med · ⚪
- **Autodesk Fusion Electronics (Eagle)** (autodesk.com) — ECAD/MCAD co-design · Inc · Public · **Bay** · Low · 🆕 (Autodesk)
- **DipTrace** · **EasyEDA (JLCPCB)** · **Upverter (Altium)** — SMB/hobbyist/cloud PCB · Inc · Low · ⚪

### AI-Native Electronics / PCB
- **Flux.ai** (flux.ai) — browser PCB + agentic Copilot layout/wiring · AI · VC · **Bay** (SF) · High · ✅ (H0118)
- **Quilter** (quilter.ai) — fully autonomous physics-driven place/route/verify · AI · $25M Series B · **Bay** (SF) · High · ✅ (H0132)
- **JITX** (jitx.com) — code-defined/generative hardware design · AI · VC · **Bay** (Berkeley) · High · ⚪
- **CELUS** (celus.io) — spec→schematic+PCB floorplan + sourcing · AI · ~$25M+ · Munich · High · ⚪
- **CircuitMind** (circuitmind.io) — architecture→schematic+BOM, AI component selection · AI · VC · London · High · ⚪
- **DeepPCB (InstaDeep)** (deeppcb.ai) — RL autorouter, KiCad-compatible · AI · InstaDeep(BioNTech) · London · Med · ⚪
- **Diode Computing** (diode.computing) — AI-assisted schematic/PCB · AI · early · US · Med · ⚪
- **Luminovo** (luminovo.com) — AI design-to-source (BOM/PCB→sourcing) · AI · $23M+ · Munich/NYC · Med · ⚪

### AI-Native Chip / Semiconductor Design & Verification
- **ChipAgents** (chipagents.ai) — agentic AI for RTL design/debug/verify · AI · $74M ($50M Series A) · Santa Barbara · High · 🆕 (H0187)
- **ChipStack** (→Cadence) — AI front-end design/verify, acquired Nov 2025 · AI · Cadence · **Bay** · Med · (now Cadence)
- **Silimate** (silimate.com) — AI debugger/copilot, PPA issue detection · AI · YC · US · Med · ⚪
- **PrimisAI** (primis.ai) — language→RTL + verification (RapidGPT) · AI · VC · US · Med · ⚪
- **SigmanticAI** (sigmantic.ai) — NL→synthesizable HDL + testbenches · AI · early · US · Med · ⚪
- **Ricursive Intelligence** (ricursive.ai) — AI across all chip-design stages · AI · seed 2025 · **Bay** (Palo Alto) · Med · ⚪
- **Astrus** (astrus.ai) — RL analog/SERDES layout automation · AI · $8M seed · Toronto · Med · ⚪

### Component Data / Library / PCB DevOps
- **SnapMagic (SnapEDA)** (snapmagic.com) — free+premium CAD models + AI search · Hyb · VC · **Bay** (SF) · High · ⚪
- **Ultra Librarian** · **SamacSys (Supplyframe)** · **Octopart/Nexar (Altium)** — CAD libraries + parts search · Inc · Med · (Octopart ✅ via Altium)
- **AllSpice** (allspice.io) — "git for hardware" ECAD revision control/diffs/CI + AI agent · AI/Hyb · $25M total · Boston · High · ✅ (H0026)
- **SI-PI sim:** Ansys SIwave · Keysight ADS · Cadence Sigrity X · Siemens HyperLynx · Polar Instruments — Inc · Med-Low · (mixed CRM)

---

## LANE 4 — PLM / Eng Data / ALM / Requirements / MBSE / Design Review

### Enterprise PLM/PDM
- **Siemens Teamcenter** (sw.siemens.com) — market-leading enterprise PLM backbone · Inc · Public · Plano · Low · ✅ (Siemens DI)
- **PTC Windchill** (ptc.com) — enterprise PLM/PDM standard · Inc · Public · Boston · Low · ✅ (PTC)
- **Dassault ENOVIA/3DEXPERIENCE** (3ds.com) — PLM on 3DX cloud · Inc · Public · France · Low · ⚪ (VIAS3D/Xavor resellers ✅)
- **SAP PLM** · **Contact Software** — ERP-centric / DACH PLM · Inc · Low · ⚪
- **Aras Innovator** (aras.com) — low-code model-based PLM · Hyb · PE · Andover MA · Med · ✅ (H0168)
- **PTC Arena** (arenasolutions.com) — cloud PLM+QMS for mid-market hardware · Hyb · Public(PTC) · **Bay** (Foster City) · High · ✅ (PTC)
- **Autodesk Fusion Manage + Upchain** (autodesk.com) — cloud PLM/PDM · Hyb · Public · **Bay** · Med · 🆕 (Autodesk)
- **Propel** (propelplm.com) — Salesforce-native PLM+QMS · Hyb · ~$80M+ · **Bay** (Santa Clara) · High · ✅ (H0090)

### Modern / cloud-native PLM & BOM
- **Duro** (durolabs.co) — cloud PLM for agile hardware (now Altium, Dec 2025) · Hyb · acq. Altium · LA · High · ✅ (H0014)
- **OpenBOM** (openbom.com) — cloud BOM + light PLM · Hyb · seed · Newton MA · High · ⚪
- **Bild** (bild.io) — modern PLM/version-control ("GitHub for hardware") · AI · $3M+ · **Bay** · High · ⚪
- **Aletiq** (aletiq.com) — next-gen cloud PLM + AI · AI · €6.5M (Point Nine) · Paris · Med · ⚪
- **Cognyx** (cognyx.io) — AI eng-acceleration + collaborative BOM · AI · seed · France · High · ⚪
- **Bommer** (bommer.com) — BOM add-in for Onshape/startups · Hyb · seed · US · High · ⚪
- **ProductFlo** (productflo.com) — cloud PLM + Haitch vision-LLM on CAD/PCB/BOM · AI · seed · Atlanta · High · ⚪
- **Makersite** (makersite.io) — AI product-lifecycle intel (cost/sustainability/compliance) · AI · $70M Series B · Stuttgart · High · ⚪
- **Kenesto** · **Guaeca** · **Nora IPLM** · **SteepGraph** — SMB/niche cloud PLM · Hyb · early · ⚪
- **CIMdata** (cimdata.com) — PLM analyst/advisory (not a vendor; possible partner) · — · Private · MI · — · ✅ (H0084)

### BOM / Component Data (overlap with Lane 7)
- **Cofactr** (cofactr.com) — procurement + component/supply-chain ops · AI · $28.8M (Bain, YC) · NYC · High · 🆕 (H0186)
- **Z2Data** (z2data.com) · **SiliconExpert** (siliconexpert.com, Arrow) · **Lumari** (lumari.ai, YC) — component intel/AI sourcing · mixed · ⚪

### ALM / Requirements
- **Jama Connect** (jamasoftware.com) — requirements mgmt + traceability leader · Hyb · PE · Portland · High · ⚪
- **Siemens Polarion** · **PTC Codebeamer** — safety-critical ALM · Inc · ✅ (Siemens/PTC)
- **Perforce Helix ALM** (perforce.com) · **Visure** (visuresolutions.com, +AI) · **IBM DOORS** · **Inflectra SpiraTeam** — req/test mgmt · Inc/Hyb · Low-Med · ⚪
- **QRA Corp / Qubric** (qracorp.com) — GenAI requirements quality/generation · AI · seed+defense · Halifax · High · ⚪
- **Specira AI** (specira.ai) — AI requirements-intelligence / gap detection · AI · early · US · High · ⚪

### Systems Engineering / MBSE
- **Dassault Cameo/CATIA Magic (No Magic)** (3ds.com) — leading SysML MBSE · Inc · Public · TX · Med · ⚪
- **Valispace** (valispace.com) — browser co-engineering req+parametric data + AI · AI · VC · Berlin · High · ⚪
- **Innoslate (SPEC Innovations)** (specinnovations.com) — MBSE+req with GPT assistants · AI · Private · VA · High · ⚪
- **Capella (Eclipse/Obeo)** · **Ansys SCADE** · **PTC Integrity** — MBSE/safety-critical · mixed · Low-Med · ⚪

### AI-Native Design Review & Collaboration (the standout sub-lane)
- **CoLab Software** (colabsoftware.com) — AI CAD/mechanical design review + collaboration · AI · $72M raised · Canada · High · ✅ (H0030)
- **AllSpice** (allspice.io) — "GitHub for hardware" review/diff/DevOps + AI · AI · $25M total · Boston · High · ✅ (H0026)
- (Quilter / Flux / JITX cross-listed from Lane 3)

---

## LANE 5 — Factory Ops & MES + Industrial AI / Predictive Maintenance

### MES & Factory Apps / connected worker
- **Tulip** (tulip.co) — no-code frontline ops apps/work instructions/IoT · AI/Hyb · ~$160M · Somerville MA · High · ⚪
- **First Resonance (ION)** (firstresonance.io) — Factory OS for hardware/new-space mfg · AI · ~$30M+ · LA · High · ⚪ (customers Hadrian/Saronic)
- **MaintainX** (getmaintainx.com) — mobile CMMS + AI copilot · AI · $530M+ (~$2.5B val) · **Bay** · High · ⚪
- **QAD Redzone** (rzsoftware.com) — AI connected-workforce productivity · Hyb · QAD/Thoma Bravo · FL · High · ⚪
- **Parsable** (parsable.com) — connected-worker digital work instructions · AI/Hyb · ~$118M · **Bay** · High · ⚪
- **Augmentir** (augmentir.com) — AI connected-worker/skills · AI · Series A · PA · High · ⚪
- **L2L** (l2l.com) — connected mfg ops (downtime/maintenance) · Hyb · growth · UT · High · ⚪
- **Poka (IFS)** (poka.io) — connected-worker knowledge/training · Hyb · IFS · Quebec · High · ⚪
- **Rockwell Plex** · **Fiix** · **AVEVA** · **Siemens Opcenter** · **Critical Manufacturing** · **42Q (Sanmina)** · **iBASEt** · **GE Vernova Proficy** · **DELMIA Apriso** · **Epicor** · **Infor** · **QAD** · **MasterControl** · **Aegis FactoryLogix** · **Katana** · **ProShop** — MES/ERP incumbents · Inc/Hyb · Low-Med · ⚪ (iBASEt = H0011 ✅; PlanetTogether scheduling H0163 ✅)

### Machine Monitoring & Industrial AI / Predictive Maintenance
- **MachineMetrics** (machinemetrics.com) — machine monitoring + production analytics · AI · ~$80M · Boston · High · ⚪
- **Tractian** (tractian.com) — AI sensors + CMMS, unicorn · AI · $245M+ · Atlanta/Brazil · High · ⚪
- **Augury** (augury.com) — machine health (vibration/AI), unicorn · AI · $300M+ · NYC · High · ⚪
- **Sight Machine** (sightmachine.com) — plant data analytics + AI agents (NVIDIA NVentures) · AI · ~$85M · **Bay** · High · ⚪
- **Oden Technologies** (oden.io) — real-time process analytics · AI · ~$45M · NYC · High · ⚪
- **UptimeAI** (uptimeai.com) — agentic plant monitoring/diagnostics · AI · Series A · **Bay** (San Jose) · High · ⚪
- **Cognite** · **Uptake** · **SparkCognition** · **Falkonry (IFS)** · **Senseye (Siemens)** · **Plataine** · **Samsara** · **SymphonyAI** · **Petasense** · **Novity** · **Waites** · **Nanoprecise** · **Konux** · **Seeq (Altair)** · **Infinite Uptime** · **Factory AI** — industrial-AI/PdM · AI/Hyb · seed→$300M · several **Bay** · Med-High · ⚪

---

## LANE 6 — Quality, Inspection & Machine-Vision AI / Metrology

- **Instrumental** (instrumental.com) — AI defect discovery from assembly images · AI · ~$80M · **Bay** (Palo Alto) · High · 🆕 (H0190)
- **Elementary** (elementaryml.com) — self-training machine-vision inspection · AI · ~$50M (Tiger) · Pasadena · High · ⚪
- **UnitX** (unitxlabs.com) — 3D AI vision inspection HW+SW · AI · Series A · **Bay** (Santa Clara) · High · ⚪
- **Averroes AI** (averroes.ai) — no-code AI visual inspection · AI · seed · **Bay** (Palo Alto) · High · ⚪
- **Tristar AI** (tristar.ai) — AI vision QC for lines · AI · seed/A · **Bay** · High · ⚪
- **Landing AI** (landing.ai) — LandingLens data-centric vision (Andrew Ng) · AI · ~$57M · **Bay** (Palo Alto) · High · ⚪
- **Matroid** (matroid.com) — no-code CV detector platform · AI · ~$33M · **Bay** (Palo Alto) · High · ⚪
- **Invisible AI** (invisible.ai) — edge cameras + AI assembly/ergonomics · AI · ~$30M · **Bay** (San Jose) · High · ⚪
- **Retrocausal** (retrocausal.ai) — AI copilot for manual assembly · AI · seed/A · Redmond · High · ⚪
- **Bucket Robotics** (bucket.bot) — CAD-to-vision-model defect inspection (no labeling) · AI · YC seed · Pittsburgh/SF · High · ⚪
- **Eigen Innovations** · **Pleora** · **Apera AI** · **Robovision** · **Covision Quality** · **Solomon 3D** · **Kitov.ai** · **Delvitech** ($40M) · **SixSense** · **elunic** · **Neurala** · **PowerArena** · **Musashi AI** · **Saccade Vision** · **GroundControl (YC)** · **Switchon** — AI vision/inspection · AI · seed→$40M · global · Med-High · ⚪
- **Lumafield** (lumafield.com) — AI-assisted industrial CT scanning/inspection · AI/Hyb · VC · **Bay**-adjacent · High · ✅ (H0038)
- **Incumbents:** Cognex (VisionPro/ViDi) · Keyence · Teledyne DALSA · Omron · SICK · Zeiss/Hexagon metrology — Inc · Low-Med · ⚪

---

## LANE 7 — Sourcing, Supply Chain & Digital Manufacturing Marketplaces / DFM

### Electronics sourcing / component intelligence
- **Cofactr** (cofactr.com) — full-service electronics procurement/logistics · AI · $28.8M · NYC · High · 🆕 (H0186)
- **Luminovo** (luminovo.com) — electronics supply-chain OS (AI BOM/CPQ) · AI · Series A · Munich · High · ⚪
- **Sourcengine/Sourceability** (sourcengine.com) — components marketplace + Order API · Hyb · distributor-backed · Miami · High · ⚪
- **CalcuQuote** (calcuquote.com) — EMS/CM quoting + sourcing standard · Hyb · PE · Dallas · High · ⚪
- **SiliconExpert** (Arrow) · **Z2Data** (**Bay**) · **Octopart/Nexar** (Altium) · **Supplyframe** (Siemens) · **Accuris** · **Datalynq** · **Assent** — component data/risk · Inc/Hyb · Med · (Supplyframe 🆕 H0195; Octopart ✅ via Altium)

### Digital manufacturing marketplaces & instant quoting
- **Xometry** (xometry.com) — largest on-demand mfg marketplace, instant STEP pricing · Hyb · Public · MD · High · ✅ (H0033)
- **Fictiv** (fictiv.com) — curated mfg "OS", instant quoting (Misumi) · Hyb · acq. ~$350M · **Bay** · High · ⚪ (advertiser, verify CRM)
- **Protolabs** (protolabs.com) + **Protolabs Network/Hubs** (hubs.com) — automated digital mfg + network · Inc/Hyb · Public · MN/NL · High · ✅ (H0106)
- **Jiga** (jiga.io) — relationships-first sourcing, chat with vetted shops · AI · seed/A · Tel Aviv/US · Med · ✅ (H0034)
- **SendCutSend** (sendcutsend.com) — instant-quote laser/waterjet sheet metal · Hyb · growth · Reno · High · ✅ (H0035)
- **Quickparts** · **Geomiq** · **Plethora** (**Bay**) · **Fathom** · **OSH Cut** · **Fractory** · **Komacut** · **Factorem** · **MakerVerse** · **Wikifactory** · **MFG.com** · **PCBWay** · **JLCPCB** — instant-quote marketplaces · Hyb/Inc · Med-High · ⚪

### DFM / should-cost / quote automation
- **aPriori** (apriori.com) — automated should-cost + DFM from CAD · Hyb · PE · Concord MA · High · ⚪
- **Paperless Parts** (paperlessparts.com) — quoting/estimating/DFM + AI · AI · Series B+ · Boston · High · ⚪
- **CADDi Drawer** (caddi.com) — AI drawing-data + price/supplier intel · AI · Series C ~$89M · Tokyo/Chicago · High · ⚪
- **Werk24** (werk24.io) — AI extracts dims/GD&T from drawings→JSON · AI · seed/A · Munich · High · ⚪
- **Toolpath** (toolpath.com) — AI CAM/DFM + machining cost · AI · seed/A · Cincinnati · High · ⚪
- **DFMPro (HCL)** · **Machine Research** · **DigiFabster** · **DashNode** · **StartProto (YC)** · **Boothroyd Dewhurst DFMA** — DFM/quote-automation · Inc/AI · Med-High · ⚪
- **Steelhead Technologies** (gosteelhead.com) — cloud MES/ops for finishing/job shops · Hyb · VC · MI · Med · ✅ (H0089)

### AI-native sourcing / RFQ / procurement (2023-26)
- **LightSource** (lightsource.io) — AI direct-procurement for custom parts · AI · ~$33M (Bain, Lightspeed) · **Bay** · High · ⚪
- **Hadrian / Datum Source** (datumsource.com) — AI sourcing software (SpaceX alumni) · AI · Hadrian ~$300M+ · LA · High · ⚪
- **Partsimony** (partsimony.com) — AI supply-chain design/sourcing orchestration · AI · seed/A · **Bay** · Med-High · ⚪
- **Pico MES** (picomes.com) — connected-worker factory ops · AI · Series A (Eclipse) · **Bay** · Med · ⚪
- **Keelvar / Fairmarkit / Arkestro** — AI autonomous sourcing (broader) · AI · Series B/C · Med · ⚪

---

## LANE 8 — Robotics Dev Tools & Simulation

### Dev tools / fleet / observability
- **Viam** (viam.com) — modular robotics/IoT data + AI + fleet platform · Hyb · $117M total · NYC · High · 🆕 (H0189)
- **Foxglove** (foxglove.dev) — robot multimodal-data viz/observability (MCAP) · Hyb · $58M total · **Bay** · High · 🆕 (H0188)
- **Formant** (formant.io) — cloud data-ops + teleop for fleets · Hyb · Series A+ · **Bay** · High · ⚪
- **InOrbit** (inorbit.ai) — robot orchestration/RobOps telemetry · Hyb · Series A · **Bay** (Mtn View) · High · ⚪
- **Tangram Vision** (tangramvision.com) — perception SDK (calibration/sync) · AI · seed/A · Denver · High · ⚪
- **Polymath Robotics** (polymathrobotics.com) — plug-and-play autonomy for industrial vehicles · AI · YC seed · **Bay** · High · ⚪
- **Roboto** (roboto.ai) — auto-analyze robot logs → datasets · AI · seed · Seattle · High · ⚪
- **Rerun** (rerun.io) — OSS viz + DB for multimodal physical-AI data · AI · $17M seed · Stockholm · High · ⚪
- **Intrinsic (Flowstate)** (intrinsic.ai) — web IDE + sim for industrial robot skills (Google) · Hyb · Alphabet · **Bay** · High · ⚪
- **NVIDIA Isaac** (developer.nvidia.com/isaac) — GPU robot perception/manipulation stack · Inc · Public · **Bay** · High · ⚪
- **Freedom Robotics** · **MOV.AI** · **Cogniteam** · **Rapyuta** · **Heex** · **ReductStore** · **coScene** — fleet/data infra · Hyb/AI · seed/growth · Med · ⚪

### Robotics simulation / synthetic data
- **NVIDIA Isaac Sim/Lab** · **Gazebo (Open Robotics/Intrinsic)** · **Duality AI (Falcon)** (**Bay**, San Mateo) · **O3DE** · **Genesis** · **MuJoCo (DeepMind)** · **Webots** · **SAPIEN** · **Robotec.ai** — robot sim/synthetic data · Inc/AI/OSS · Med-High · ⚪
- **Robot foundation-model labs (adjacent, low demo-fit):** Skild AI ($1.4B), Physical Intelligence ($400M+) — AI · ⚪

---

## LANE 9 — Test & Measurement / Embedded Debugging / Device Observability

- **Nominal** (nominal.io) — unified industrial test-data stack (mgmt/analysis/validation) · AI · Series B (Lux, Founders Fund) · LA/**Bay** · High · ✅ (H0053)
- **Sift (Sift Stack)** (siftstack.com) — observability for hardware telemetry (ex-SpaceX) · AI · seed/A · **Bay** · High · ⚪
- **Ohm** (YC) — AI copilot for hardware test labs · AI · YC seed · **Bay** · High · ⚪
- **Memfault** (memfault.com) — cloud observability for MCU/RTOS/Android fleets · AI · Series B ~$32M · **Bay** · High · ⚪
- **Percepio** (percepio.com) — RTOS trace viz + DevAlert observability · Hyb · VC · Sweden · High · ⚪
- **Saleae** (saleae.com) — Logic 2 software + USB logic analyzers, protocol decoders · Hyb · Private · **Bay** · High · 🆕 (H0198)
- **Keysight PathWave** (keysight.com) — test software framework/automation/analytics · Inc · Public · Santa Rosa · Med · 🆕 (Keysight H0201)
- **NI / Emerson (LabVIEW/SystemLink)** (ni.com) — graphical test dev + cloud test data · Inc · Emerson · Austin · Med · ⚪
- **Total Phase** · **Sigrok/PulseView** · **SEGGER (Ozone/SystemView)** · **Lauterbach (TRACE32)** · **Dewesoft** · **HBK** · **OROS** · **DSP Concepts** ($55M, **Bay**) · **Tektronix** — T&M/embedded debug · Inc/Hyb/OSS · Med · ⚪

---

## Cross-cutting takeaways (for floor curation)

**Already ours (✅ existing relationships that can anchor the floor with credibility):** Onshape/PTC/Arena/Creo/Codebeamer (PTC), Siemens DI (NX/Solid Edge/Teamcenter/EDA/Polarion), Autodesk (🆕), Cadence (🆕), Ansys (🆕), Altium (+Octopart/Duro), nTop, Quilter, Flux, AllSpice, CoLab, Neural Concept, Modelwise, Propel, Aras, Duro, Nominal, Xometry, Jiga, SendCutSend, Protolabs, Formlabs, Synera, Mastercam, Lumafield, Steelhead, iBASEt, PlanetTogether. **Plus the 20 just-registered (🆕).** That's already enough warm relationships to credibly fill a v1 floor.

**Highest-energy AI-native net-new to recruit (⚪, mostly Bay Area, demo High):** Adam, Zoo, Hestus, MecAgent, Leo AI, DraftAid (CAD); Luminary Cloud, Vinci, Godela, Monolith AI (simulation); JITX, CELUS, SnapMagic, Silimate (EDA); CoLab-tier already ours; Valispace, Innoslate, ProductFlo, Makersite (PLM/req); Tractian, Augury, MachineMetrics, Sight Machine, UptimeAI, Tulip, First Resonance, MaintainX (factory); Instrumental(ours), Elementary, UnitX, Landing AI, Matroid, Averroes, Bucket Robotics (inspection); LightSource, aPriori, Paperless Parts, Werk24, CADDi (sourcing/DFM); Formant, InOrbit, Tangram, Polymath, Rerun, Roboto (robotics); Sift, Ohm, Memfault (test).

**Bay Area cluster (cheapest to recruit for an SF event):** Fusion/Autodesk, Cadence, Synopsys, Adam, Hestus, MecAgent, Spline, Bild, Carbon, Velo3D, 3DPrinterOS, Luminary Cloud, Rescale, OnScale, Vinci, Godela, NVIDIA, Flux, Quilter, JITX, SnapMagic, Ricursive, Arena, Propel, Z2Data, SiliconExpert, MaintainX, Parsable, Sight Machine, UptimeAI, Samsara, SymphonyAI, Petasense, Novity, Instrumental, Averroes, UnitX, Landing AI, Matroid, Invisible AI, Fictiv, Plethora, LightSource, Partsimony, Pico MES, Foxglove, Formant, InOrbit, Polymath, Intrinsic, Duality, Sift, Ohm, Memfault, DSP Concepts, Saleae, Total Phase, Physical Intelligence.

**Data-confidence caveats (verify before outreach):** fast-moving 2025-26 funding/HQ for the seed-stage names (Diode Computing, SigmanticAI, Ricursive, Toolpath, DashNode, StartProto, Partsimony, Cognyx, Bommer, Guaeca, Bramble, Navasto, Quaisr). Several recently acquired and partly "captured": Duro→Altium, ChipStack→Cadence, Senseye/Inspekto→Siemens, Falkonry/Poka→IFS, Sualab/Drishti→Cognex/Apple, ESI→Keysight, Octopart→Altium→Renesas, SiliconExpert→Arrow, Supplyframe→Siemens. "Astera Labs" is a chip maker, not EDA (excluded). Fictiv CRM status to confirm.

## Related
- [[../workflows/hwfyi-cy2026-gap-close-targets]] — the 20 net-new sponsor targets (H0183–H0202), many of which are the headline demo vendors here
- [[sf-tech-week-2026-sponsor-prospects]] — SFTW prospect list
- [[../properties/hardware-fyi]] · [[kinetic]]
