# Trap Scorecard – Requirements Specification

---

# 1. Tier 1 – Strategic Goals

- **T1-1** Digitize trap squad scoring.
- **T1-2** Improve scoring accuracy and reduce calculation errors.
- **T1-3** Increase efficiency and usability on the trap line.
- **T1-4** Support multiple squads and traps.
- **T1-5** Ensure field reliability (offline capable).
- **T1-6** Maintain commercial control and licensing authority.

---

# 2. Tier 2 – System Specifications

- **T2-1.1** The system shall provide a fully electronic scoring interface.
- **T2-2.1** The system shall automatically calculate shooter totals.
- **T2-3.1** The system shall be optimized for touch-based input.
- **T2-4.1** The system shall support multiple squads selectable at runtime.
- **T2-4.2** Each squad shall include trap number, date, and time metadata.
- **T2-5.1** The system shall operate without an active internet connection.
- **T2-6.1** The system shall include an explicit non-commercial license.

---

# 3. Tier 3 – Functional Requirements

## 3.1 Scoring Interface

- **T3-1.1.1** The system shall display 25 shot boxes per shooter.
- **T3-1.1.2** Each shot box shall cycle `blank → X → O` on tap.

## 3.2 Scoring Accuracy

- **T3-2.1.1** The system shall display a running hit total per shooter.

## 3.3 Usability

- **T3-3.1.1** Each shot cell shall be ≥ 44px in width and height.
- **T3-3.1.2** The UI shall use high-contrast visual indicators for hit and miss.

## 3.4 Squad Management

- **T3-4.1.1** The system shall provide a squad selection dropdown.
- **T3-4.2.1** The system shall display trap number.
- **T3-4.2.2** The system shall display squad date.
- **T3-4.2.3** The system shall display squad time.

## 3.5 Data Persistence

- **T3-5.1.1** The system shall store scoring data locally on the device.
- **T3-5.1.2** The system shall restore stored scores upon reload.

## 3.6 Licensing

- **T3-6.1.1** The system shall display copyright and license notice in the UI.

---

# 4. Tier 4 – Software / Technical Requirements

## 4.1 Application Architecture

- **T4-1.1.1.1** The scoring grid shall be generated dynamically using JavaScript.
- **T4-1.1.2.1** Shot cycling logic shall use event listeners bound to each grid cell.

## 4.2 Score Calculation

- **T4-2.1.1.1** Totals shall be computed using array filtering for value `"X"`.

## 4.3 User Interface Implementation

- **T4-3.1.1.1** CSS shall define minimum width and height of 48px for shot cells.

## 4.4 Squad Configuration

- **T4-4.1.1.1** Squad metadata shall be stored in structured JSON format.

## 4.5 Offline & Persistence

- **T4-5.1.1.1** Score persistence shall use the browser `localStorage` API.
- **T4-5.1.2.1** Scores shall be serialized using `JSON.stringify()` and restored using `JSON.parse()`.
- **T4-5.1.3.1** A service worker shall cache core application files for offline operation.

## 4.6 Licensing Implementation

- **T4-6.1.1.1** The repository shall include a LICENSE file defining non-commercial terms.

---

# 5. Requirements Traceability & Verification Matrix

| Tier 1 | Tier 2 | Tier 3 | Tier 4 | Verification Method |
|--------|--------|--------|--------|---------------------|
| T1-1 | T2-1.1 | T3-1.1.1 | T4-1.1.1.1 | Demo |
| T1-1 | T2-1.1 | T3-1.1.2 | T4-1.1.2.1 | Demo |
| T1-2 | T2-2.1 | T3-2.1.1 | T4-2.1.1.1 | Analysis |
| T1-3 | T2-3.1 | T3-3.1.1 | T4-3.1.1.1 | Inspection |
| T1-3 | T2-3.1 | T3-3.1.2 | — | Inspection |
| T1-4 | T2-4.1 | T3-4.1.1 | T4-4.1.1.1 | Demo |
| T1-4 | T2-4.2 | T3-4.2.1–3 | — | Inspection |
| T1-5 | T2-5.1 | T3-5.1.1–2 | T4-5.1.1–3 | Demo |
| T1-6 | T2-6.1 | T3-6.1.1 | T4-6.1.1.1 | Inspection |

---

# 6. Verification Method Definitions

- **Demo** – Verified by demonstrating functionality in the running application.
- **Analysis** – Verified by reviewing logic, calculations, or algorithm correctness.
- **Inspection** – Verified by reviewing source code, configuration, or documentation.