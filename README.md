

# L.I.O.N. - Live Invasive-species Observation Network

> *Helping people see reefs in time: not after the outbreak, after the collapse, after the silence. In time.*

---

## Abstract

**L.I.O.N.** is a hybrid reef-monitoring platform for invasive and bioindicator species detection and ecological observation. It allows users to upload underwater media (images, video, etc.), route those inputs through specialized detection pipelines, and review annotated outputs directly in the browser. L.I.O.N. is a system for reading reef stress through invasive species, coral predators, fish and invertebrate indicators, and megafauna presence.

From a technical standpoint, L.I.O.N. combines a Next.js monitoring surface, a detector-routing API gateway, hosted Roboflow inference for fast deployment-friendly workflows, a remote FastAPI service for heavier YOLO models, an interactive species map sourced from federal observation data, and model-report pages for evaluation transparency. The system currently supports three detector lanes (Lionfish Watch, Crown of Thorns, and a broader Reef Health Suite), each backed by a different inference strategy suited to its computational demands. Every detection run produces structured, exportable outputs: annotated overlays, bounding boxes, species labels, confidence scores, frame-level JSON metadata, and run manifests.

We seek to be at the forefront of computational marine ecology: building tools that let researchers observe more, react faster, and understand the reef as a living system rather than a backdrop for isolated sightings.

---

## Inspiration

A reef in decline does not make noise. The change arrives quietly, over weeks, in ways that a single dive cannot confirm. Herbivorous fish thin out. Algae begins to fur the coral in places it had never reached before, a faint green film at first, then thicker, then suffocating. Juvenile fish vanish from the crevices where they once sheltered. The water column, which on a healthy reef pulses with small bodies and flickers of reflected light, grows emptier. None of this announces itself. Reefs are patient structures. They have been building themselves, polyp by polyp, for thousands of years. They do not die loudly.

Coral reefs are some of the most biodiverse ecosystems on Earth. Often called the "rainforests of the sea," they occupy less than one percent of the ocean floor yet sustain roughly 25% of all known marine species. A healthy reef is habitat, nursery, shelter, food web, and infrastructure all at once. Fish breed in the branching coral. Invertebrates graze along the surface. Predators regulate the populations below them. The shoreline behind the reef stays intact because wave energy that would otherwise erode beaches and flood coastal communities breaks against the reef structure first. When reefs decline, the damage does not remain local. It moves outward through fisheries, coastal protection, tourism economies, and the broader marine ecosystem.

However, over the past century, these natural habitats have rapidly declined to the point where nearly half of them have been destroyed. Our team investigated some of the primary contributors to coral degradation and discovered that invasive species like lionfish are accelerating reef decline by disrupting the delicate ecological balance that coral depends on to survive. By many scientific estimates, nearly half of the world's coral reefs have already been lost, and those that remain face mounting pressure from ocean warming, acidification, pollution, overfishing, and disease. Each of these alone is serious. Together, they create conditions under which even small additional disturbances can tip a reef from stressed to collapsing.

Invasive lionfish are one such disturbance, and they are far from small.

### The Lionfish Problem

*Pterois volitans* and *Pterois miles*, native to the Indo-Pacific, were first documented in Atlantic waters off the Florida coast in the mid-1980s, likely released through the aquarium trade. They are beautiful animals. Striped, elaborate, venomous, and spectacularly efficient at what they do, which is eat. Since their introduction, lionfish have spread through the Caribbean, the Gulf of Mexico, and deep into South American coastal waters with a speed that has alarmed marine ecologists for decades.

What makes lionfish so ecologically destructive is not any single trait but the way several converge. A single lionfish can reduce juvenile reef fish populations on a patch of reef by up to 79% in just five weeks. They consume over 50 species of fish and invertebrates, many of which are critical to reef health: the herbivores that keep algae from smothering coral, the cleaner species that maintain symbiotic relationships, the juvenile fish that represent the next generation of reef biodiversity. In their invaded range, lionfish have virtually no natural predators. The venomous dorsal spines that make them popular in aquarium shops deter every Atlantic species that might otherwise control their numbers. A single female produces approximately two million eggs per year in free-floating mucus masses that ocean currents carry across enormous distances. They mature quickly. They thrive at depths from shallow mangroves to mesophotic reefs hundreds of feet down, well beyond the reach of most removal divers.

The result is a predator that does not merely arrive on a reef but restructures predation within it. Herbivores decline. Algae overgrows coral. Juvenile recruitment collapses. The reef, already under pressure, loses another layer of resilience, and the feedback loop tightens. Coral reefs do not need another efficient predator. They have one.

### Why We Built L.I.O.N.

Existing community-science efforts that rely on manually reported photos and sightings are valuable. They are also slow, and take large amounts of effort across multiple volunteers. Reports arrive days or weeks after the observation. Location data is often imprecise. And a form that says "lionfish sighted" tells you something, but a system that can say "lionfish detected, herbivore density low, crown-of-thorns aggregation forming at these coordinates, megafauna absent from the transect" tells you considerably more.

We wanted to build something more active: a system that can begin reading reef footage as it arrives, identify invasive threats early, and place those detections beside broader biological signals. Therefore, we created L.I.O.N., a platform dedicated to tracking invasive and bio-indicator populations to protect coral reef ecosystems.

L.I.O.N. began with lionfish. It did not stay there. Once the detection pipeline was working, we realized that the same architecture could serve a much larger ecological purpose. A reef cannot be understood through a single species, however destructive. It must also be read through indicator organisms, predator-prey ratios, coral-specific threats like crown-of-thorns starfish, and the broader texture of what is present and what is missing. The platform grew to match that realization.

---

## So what is L.I.O.N.?

L.I.O.N. (short for Live Invasive-species Observation Network) is a system dedicated to identifying distinct marine species to protect coral reef ecosystems. While L.I.O.N.'s main purpose was originally the early-detection of invasive lionfish, our team eventually realized that this website had the potential to help scientists not just combat lionfish, but also identify a wide array of other species that serve as biological indicators of the overall ecosystem health.

To accomplish this, L.I.O.N. uses a YOLO-based machine learning pipeline to analyze underwater footage in real time, drawing detections directly onto the video frame by frame. Users can upload footage through our web interface, select a detector lane, adjust the confidence threshold, and instantly receive results including labeled bounding boxes identifying each detected species and confidence scores indicating how certain the model is for each detection.

The system currently supports three detector lanes, each backed by an inference strategy matched to its computational demands:

| Detector Lane | Purpose | Backend |
|---|---|---|
| **Lionfish Watch** | Early detection of invasive lionfish | Hosted Roboflow model |
| **Crown of Thorns** | Coral-predator detection for COTS outbreaks | Hosted Roboflow model |
| **Reef Health Suite** | Broader analysis across fish, invertebrates, megafauna, and rare species | Remote FastAPI service or local YOLO fallback |

For each run, L.I.O.N. returns:

- Annotated image or video overlays with drawn bounding boxes
- Species labels for each detection
- Confidence scores indicating prediction certainty
- Frame-level JSON metadata with bounding box coordinates, class labels, and frame indices
- Run manifests for reproducibility and downstream analysis

Around that detection workflow, the platform also includes:

- An interactive invasive-species map built from a CSV dataset of 150 mapped observations across 6 invasive marine species, sourced from [catalog.data.gov](https://catalog.data.gov/dataset/?tags=lionfish)
- A prediction gallery tied to real marine organisms rather than generic placeholders
- Dedicated model-report pages showing precision-recall curves, confusion matrices, F1-confidence behavior, and training-loss plots

The distinction between these outputs matters. Many detection demos flash a label and a confidence number, and then the result disappears. L.I.O.N. produces a reviewable, structured, exportable ecological record. A detection that is logged, that can be aggregated across time and location, disputed or confirmed by a second observer, and integrated with external databases has a fundamentally different kind of scientific value than a detection that exists only as a momentary overlay on a screen.

L.I.O.N. has one simple mission: to protect the reefs that the ocean cannot afford to lose.

---

## System Architecture

L.I.O.N. is structured as a layered system with separated responsibilities for presentation, request routing, inference, and structured output. That separation was not a stylistic preference. It was forced on us by a constraint that became apparent early in the build: large YOLO model weights, frame-by-frame video inference, and serverless deployment environments do not coexist comfortably. We designed around that tension, and the resulting architecture is probably the most important engineering decision in the project.

### Front-End Monitoring Surface

The front end is built in **Next.js**, **React**, and **TypeScript**. The main page (`app/page.tsx`) operates as a long-scroll monitoring dashboard that introduces the ecological context, presents the available detector lanes, embeds the Live Lab upload and review interface, renders a multi-species prediction gallery, visualizes invasive-species sighting data on the interactive map, and provides access to model analytics pages.

We designed the interface to feel like a monitoring surface. Someone who works in marine conservation should be able to look at it and think, "I could actually use this." That standard shaped decisions throughout: layout hierarchy, color, typography, control placement, result presentation. An interface that looks careless makes everything behind it feel unreliable, regardless of actual model accuracy. We wanted L.I.O.N. to convey competence before a user even uploaded a file.

### Live Lab Interaction Layer

The **Live Lab** (`app/components/live-lab.tsx`) is the operational center of the application. It manages file upload for images and video with client-side validation and progress indication, detector lane selection across all three pipelines, confidence threshold adjustment via slider (so users can tune the sensitivity-specificity tradeoff for their use case), preview generation through `URL.createObjectURL`, remote polling for asynchronous video processing jobs, and overlay rendering by mapping prediction coordinates onto the preview panel.

When a user selects the Reef Health Suite, the Live Lab exposes specialty toggles for **Fish + Invertebrates** and **MegaFauna + Rare Species**, which determine which paired YOLO models are invoked for the run. The component is aware of different deployment conditions and degrades gracefully: if a remote service is unavailable, the interface displays appropriate messaging rather than failing silently.

### API Gateway and Request Routing

The Next.js API route (`app/api/live-lab/detect/route.ts`) serves as a routing layer between the browser and the appropriate inference backend. Its logic:

1. If the user selects **Lionfish Watch** or **Crown of Thorns**, the request routes to a hosted Roboflow model.
2. If the user selects **Reef Health Suite** and a remote marine-detect service is configured via environment variables, the input goes to the FastAPI service.
3. If no remote service is configured, the system falls back to the local Python YOLO pipeline.
4. For video uploads too large to proxy safely within serverless function limits, the file is first staged in **Vercel Blob** storage, then a remote job is initiated from the blob URL.

This routing logic means the platform adapts to different deployment configurations without code changes. A cloud-hosted production environment, a local development machine, and a researcher's laptop in a field station with intermittent connectivity can each run a version of the system suited to their available resources.

### Hosted Detection Lanes

Two lanes use hosted Roboflow inference:

- **Lionfish Watch**: workspace/model `su-eaelw/lionfish-qs3tq/49`
- **Crown of Thorns**: workspace/model `roboflow/crown-of-thorns-detection-pgppy/1`

These are lightweight and deployment-friendly. For images, the system retrieves prediction JSON directly. For videos, it initiates asynchronous remote jobs and polls for completion. Hosted inference keeps latency low and eliminates the need for local GPU resources on these two well-scoped detection tasks.

### Remote Reef Health Suite

The broader reef-health workflow runs on a separate **FastAPI** service (`services/marine_detect_api/main.py`) written in Python. This service exists because certain detection models are too large or too computationally expensive for a serverless function to handle within reasonable timeout windows.

The service accepts uploads through `/detect/upload` and remote URLs through `/detect/url`, resolves YOLO model weights from environment variables or downloadable URLs, creates isolated run directories for each inference request, invokes the detection pipeline, and returns structured JSON with per-frame detection metadata and annotated media.

Current reef-health specialties:

| Specialty | Coverage |
|---|---|
| **Fish + Invertebrates** | Butterflyfish, grouper, parrotfish, snapper, moray eel, giant clam, urchin, sea cucumber, lobster, crown of thorns |
| **MegaFauna + Rare Species** | Sharks, rays, sea turtles, and other less frequently observed large fauna |

### Local CLI Fallback

The system includes a command-line pipeline (`lionfish_yolo.py`) that supports both `hosted-predict` and `local-predict` execution modes. It processes single images, image directories, and video files. It can accept multiple YOLO model weight files simultaneously, draw bounding boxes with OpenCV, export structured JSON sidecars alongside annotated media, and write comprehensive run manifests to `last_run.json`.

For the multi-model case, the inference logic can be expressed as:

$$D_t = \bigcup_{k=1}^{K} D_t^{(k)}$$

where $D_t^{(k)}$ is the set of detections from model $k$ on frame $t$, and the retained detections at confidence threshold $\tau$ are:

$$\tilde{D}_t(\tau) = \lbrace d \in D_t \mid p(d) \ge \tau \rbrace$$

This formulation makes the Reef Health Suite extensible: additional model lanes can be incorporated by supplying new weight files, without restructuring the application logic.

### Spatial and Evaluation Layers

**Species Map.** Built with **Leaflet** and **React-Leaflet**, the map reads a CSV of invasive-species observations sourced from [data.gov](https://catalog.data.gov/dataset/?tags=lionfish) and renders point distributions globally. Users can explore sighting density, geographic spread, and species-specific distribution patterns. The map grounds detection outputs in spatial reality and provides the foundation for future migration-pattern analysis.

**Model Report Pages.** Precision-recall curves, confusion matrices, F1-confidence behavior plots, and training-loss graphics make model performance visible and auditable. These pages exist because treating a model as a black box is insufficient when downstream decisions involve resource allocation, removal operations, and conservation policy. A scientist reviewing L.I.O.N.'s outputs should be able to evaluate the detector's reliability, not accept it on faith.

### Reference Run

The repository includes a representative lionfish detection run:

| Metric | Value |
|---|---|
| Frames processed | **246** |
| Resolution | **960 × 540** |
| Total detections | **248** |
| Average confidence | **0.8703** |
| Peak confidence | **0.9063** |
| Runtime | **8.21 s** |

This gives the project a concrete performance baseline grounded in actual inference rather than a rhetorical claim of functionality.

---

## How we built it:

We built L.I.O.N. across four layers, and the most consequential decision we made was accepting that they needed to remain separate.

**Front End:** We built the web interface using Next.js and TypeScript, allowing users to access an aesthetic UI where they can upload footage and view detections directly in the browser seamlessly. The homepage, the Live Lab upload workflow, the detection gallery, the interactive species map, the model analytics pages: each had to work together as a coherent monitoring surface. We spent more time on interface design than we initially planned. This was not vanity. An interface that feels slapdash makes everything behind it suspect, and we needed scientists (or at least, judges imagining scientists) to trust what they were looking at.

**ML Pipeline:** We trained and integrated YOLO-based models to detect lionfish and other reef species across video frames, drawing bounding boxes and indicating confidence scores. We did this with a mix of train-test-split validation and transfer learning on existing marine-species datasets. Training on underwater imagery presents its own challenges: color shifts with depth (reds vanish first, then oranges, then yellows, until the world is blue-green and indifferent to your model's expectations), inconsistent lighting from surface refraction, motion blur from currents, and the visual similarity between certain species at juvenile stages. We learned more about the optical properties of seawater than we expected to when we started a hackathon project.

The inference architecture is hybrid by design. Our first instinct was clean and optimistic: run everything through a single hosted model. That works for one lightweight detector. The moment we tried to support multiple marine-detection models with larger YOLO weights, we collided with serverless reality: function timeouts, deployment-size caps, and the basic incompatibility between "analyze 250 frames of underwater video" and "respond in under ten seconds from a cold start." You cannot stuff a large YOLO model into a serverless function and expect it to think carefully about fish. We tried. The function timed out.

So we built three tiers. Hosted Roboflow models handle the lighter lionfish and crown-of-thorns workflows. A separate FastAPI service in Python handles heavier reef-health analysis with paired YOLO weights. A local CLI pipeline ensures the system can still run on a machine with the correct model files even when cloud services are down. Three inference environments, each suited to different workloads:

$$\text{Hosted API} \quad \mid \quad \text{Remote FastAPI Service} \quad \mid \quad \text{Local CLI}$$

Building that architecture was more work than any of us anticipated. It meant managing environment variables across deployment targets, implementing async video processing, handling cross-service request flows, staging large uploads through Vercel Blob, and writing fallback logic in the front end for cases when a backend was unavailable. It also meant that the project behaves like actual software rather than a single-path demo that works only under ideal conditions.

**Video Editor:** Used DaVinci Resolve to produce our pitch video, incorporating smooth transitions and color grading. None of us had significant prior experience with DaVinci Resolve. The learning curve was steep, the color grading took longer than the actual filming, and we are unreasonably proud of the result.

| Layer | Technologies |
|---|---|
| **Front End** | Next.js, React, TypeScript, Tailwind CSS, Leaflet, React-Leaflet |
| **API Gateway** | Next.js API Routes, Vercel Blob Storage |
| **Hosted Inference** | Roboflow Hosted API |
| **Remote Inference** | Python, FastAPI, Ultralytics YOLO |
| **Local Pipeline** | Python, Ultralytics YOLO, OpenCV |
| **Deployment** | Vercel (front end + gateway), configurable remote service |
| **Video Production** | DaVinci Resolve |
| **Version Control** | Git, GitHub |

---

## Challenges we faced:

While creating L.I.O.N., we encountered a variety of challenges both technical and collaborative, and they had a habit of arriving simultaneously.

**Architectural honesty.** The first and most consequential challenge was being honest about what can and cannot run in a serverless environment. A single hosted detector is convenient. A platform that supports three detector lanes, large video uploads, paired YOLO model weights, and structured output for every run is not convenient at all. We had to confront function timeouts, deployment-size limits, storage quotas, remote-service configuration, and asynchronous video processing. The temptation was to simplify the problem by pretending the constraints did not exist. The better decision was to design around them, which is how the three-tier inference architecture came into existence. It was the right call. It also tripled the engineering surface area overnight.

**Storage.** We ran out of backend storage on Vercel during development. Large video files and model outputs consumed available space with alarming speed. We implemented Vercel Blob staging for uploads and became more disciplined about what persisted on the server versus what was computed on demand and discarded. This was unglamorous infrastructure work. Also necessary. (Nobody writes home about storage management, but storage management is why the demo runs.)

**Merge conflicts.** Working simultaneously in GitHub with multiple team members touching the front end, API layer, ML pipeline, and media assets meant that merge issues arrived regularly when pull requests overlapped. On more than one occasion, someone's working copy broke because upstream changes had been merged minutes earlier without warning. We learned the importance of communicating about shared files before editing them. We wish we had learned this at hour one instead of hour fourteen.

**Scope.** L.I.O.N. began as lionfish detection. Then someone said, "We should detect crown-of-thorns too." Then someone else said, "We need model-report pages so the detections aren't just numbers on a screen." Then: "The map gives sightings spatial context." Each addition was motivated by a genuine insight. Each addition also consumed hours we did not have in unlimited supply. Having to balance different tasks throughout the group was a difficult endeavor, and learning to scope tightly, to say "yes, and we will build the focused version," was a skill we developed under the specific duress of a 36-hour clock.

**Experience.** Some of our team members had never competed in a hackathon before participating in SMathHacks. For them, the weekend was an immersion in compressed decision-making, building under uncertainty, and the art of shipping something functional rather than something theoretically perfect. Time management was a real challenge: how do you divide 36 hours across model training, front-end development, API integration, data visualization, debugging, and a pitch video? We did not always divide them wisely. But we got better at it as the hours passed, which is, we suppose, the point.

**The harder problem.** Perhaps the most important challenge was also the quietest. Fixing bugs through countless iterations is frustrating but tractable. The conceptual gap between "detecting a fish in a video frame" and "building a system that speaks usefully about reef health" is a different kind of difficulty. It involves not just model accuracy but data design, interface legibility, structured output, evaluation transparency, and a genuine understanding of what a marine scientist would need in order to trust the platform. We spent time we could have spent writing code thinking instead about what makes a tool useful rather than merely impressive. That thinking shaped the analytics pages, the JSON export format, the multi-model architecture, and the overall design.

It was worth the time.

---

## What we learned:

Working on L.I.O.N. during this 36-hour hackathon allowed us to vastly improve our soft and hard skills, though the learning was rarely comfortable while it was happening.

**Technical skills.** This project pushed every member of the team into unfamiliar territory. YOLO-based object detection: training, evaluation, confidence-threshold tuning, transfer learning, and the specific difficulties of underwater imagery. Next.js and TypeScript application development with server-side API routes and client-side state management. FastAPI service construction for remote inference. OpenCV video processing and frame-by-frame annotation. Interactive geographic visualization with Leaflet. Video editing and color grading in DaVinci Resolve. L.I.O.N. resulted in us learning many new technical skills, and we learned them the way you learn anything real: by needing them, struggling with them, and eventually getting them to work at 3 a.m.

**Design and product thinking.** We learned that a detection result matters more when it is visible, reviewable, and exportable. The browser overlays, JSON manifests, map layer, and analytics pages are not supplementary features. They are what make the system legible. A scientist needs something to inspect, question, and dispute. Results that are opaque are not useful results, regardless of the model's accuracy. This lesson will stay with us beyond this hackathon.

**Collaboration.** Besides providing valuable hands-on learning, this opportunity highlighted the importance of team coordination and proper communication. We learned to navigate challenges together and delegate roles in order to prevent overlap. We also learned, the way most teams learn it, that communication is architecture. A team that does not coordinate will eventually discover that its worst bugs are social rather than technical. Poor coordination produces merge conflicts, duplicated effort, and misaligned assumptions about how components interact. We got better at this as the hackathon progressed. We will be better still next time.

**Resilience.** Learning to adapt from failure and grow from it was vital to moving forward with our project. We broke things. We merged things that should not have been merged. We hit platform limits we did not anticipate. We discovered at inconvenient moments that dependencies were missing or that our assumptions about deployment behavior were wrong. Every time, we fixed it and moved forward. L.I.O.N. is the product of that persistence, not of any single moment of brilliance.

---

## Accomplishments We're Proud Of

**The map module.** We are proud of the map module we added to our application. Using [catalog.data.gov](https://catalog.data.gov/dataset/?tags=lionfish), we were able to find the GPS locations of sighted invasive species across six species and 150 mapped observations. Creating a database of this information, our website calls and populates the interactive Leaflet map with species-specific point distributions that users can explore geographically. The map grounds detection outputs in spatial reality. Using this information, we hope to also predict future migration patterns of these invasive species, so that researchers can better position catching devices and regulate environments with ease.

**The detection pipeline works.** This is worth stating plainly: you can upload a video, route it through a detector lane, and review annotated results in the browser. Bounding boxes, species labels, confidence scores, exportable JSON. The reference lionfish run processed 246 frames at 960×540 resolution, recorded 248 detections, and achieved an average confidence of 0.87 with structured frame-level metadata ready for downstream analysis. That is not a mockup. It is a real inference pipeline producing real ecological data.

**The system grew up during the hackathon.** L.I.O.N. started as a lionfish detector. Over 36 hours it became a multi-model reef-health platform with dedicated lanes for invasive species, coral predators, indicator organisms, and megafauna. That shift changed the meaning of the project. The reef stopped being a backdrop for a computer vision demo and became the subject we were actually trying to understand. We are proud that the ambition expanded and that we managed to ship the expanded version.

**The interface has a point of view.** It looks like a monitoring surface, something with operational logic and visual coherence. We wanted it to feel usable, and we think it does.

**The evaluation transparency.** Model-report pages with precision-recall curves, confusion matrices, and training-loss graphics. Many hackathon projects treat the model as a black box. We wanted ours to show its work.

---

## Our Next Step

There are multiple places that we want to improve our product so it has a greater impact on the world. L.I.O.N. is a functional prototype with genuine depth, but turning it into a complete ecological platform requires continued development across several directions.

### Impact Estimation

The first priority is clearly articulating the impact that invasive species actually have on the environment. We want to move beyond species detection toward contextual impact annotations displayed directly in the interface. For example: **"ESTIMATED IMPACT: ~20 native fish consumed/week."**

However, to implement this feature we will need to have and collect more metadata of the fish. By enhancing our model to also detect the weight, size, and behavior of the species, we can more accurately calculate the impact it has on the reef or the surrounding environment. A lionfish detection that also estimates body length, for instance, could be cross-referenced against published predation-rate data to produce a meaningful ecological cost estimate rather than a bare species label.

### Behavioral Prediction

We want to predict the behavioral patterns of marine species, allowing users to have an estimation of the area and direction that the species is likely to spread over the next 48 hours. L.I.O.N. would use camera detections and local environmental variables such as GPS coordinates, water temperature, and current speed to model dispersal probabilities. This would shift the platform from reactive detection to predictive intelligence, giving field teams actionable information about where to focus removal and monitoring efforts before populations establish in new territory.

### Quality Gate

In the field (underwater photography in particular), images are often blurry, underexposed, or color-shifted by depth. If the model receives unusable input, the resulting detections are unreliable, and the data that enters the system becomes noise rather than signal. We want to implement an **Image Quality Assessment** layer that grades photos and videos analyzed by the model based on sharpness and lighting. If an upload falls below quality thresholds, the system would flag it with a **"LOW CONFIDENCE — RE-SCAN"** alert and, where possible, attempt automated enhancement through super-resolution techniques before re-evaluating. This ensures data integrity and prevents our invasive-species database from accumulating junk data that degrades the value of the entire dataset.

### Additional Priorities

| Priority | Description |
|---|---|
| **Live alerting** | Push notifications to researchers and field teams when high-confidence invasive-species detections occur, enabling rapid-response removal |
| **Longitudinal reef scoring** | Track species composition and reef-health indicators over time, computing ecological indices from accumulated detection data |
| **Biodiversity trend analysis** | Aggregate detections across surveys and locations to identify macro-level ecological shifts and early warning patterns |
| **Expanded species coverage** | Additional models for coral bleaching, algae overgrowth, and further predator and indicator classes |
| **Production reliability** | Containerization, health-check endpoints, auto-scaling, and graceful degradation for the remote inference service |
| **Richer exports** | CSV, GeoJSON, and COCO-format annotations for interoperability with existing marine science databases and GIS tools |
| **Aggregation analysis** | Species co-occurrence measurement, spatial clustering, and temporal behavior analysis across reef footage |

### Where This Is Heading

The trajectory of the platform can be captured in a reef-state vector:

$$R_t = \left[N_{\text{lionfish}},\; N_{\text{COTS}},\; N_{\text{herbivores}},\; N_{\text{predators}},\; N_{\text{megafauna}}\right]_t$$

The goal is to move past detecting a single species in frame $t$ toward estimating how the biological composition of a reef is changing through time. A platform that can track $R_t$ across weeks and months becomes something different from a detector. It becomes a longitudinal ecological instrument.

That ambition is simple to state. It is not simple to achieve. But the architecture is in place, the detection pipeline is functional, the data design supports structured accumulation, and the team now has the experience of building something real under severe time constraints.

We built L.I.O.N. because the ocean's problems deserve real engineering. We intend to keep building.

---

*L.I.O.N. was built at SMathHacks 2026.*
