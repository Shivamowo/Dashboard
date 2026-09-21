/**
 * Google Sheets behind each department's data (Drive folder "VBSPU HoD Data").
 * Departments split out of a combined workbook (CSE/IT, Business Economics/
 * Management, Electronics/ECE, Biotech/Micro/Biochem/Env. Studies) share the
 * one sheet, so each of them still gets its own link.
 */
const sheet = (id: string) => `https://docs.google.com/spreadsheets/d/${id}/edit?usp=drive_link`;

export const SOURCE_FOLDER_URL = "https://drive.google.com/drive/u/0/folders/1JxENCXLjrT3CGx29ODKAtxQ9zh3pCXyx";

const S = {
  appliedPsychology: sheet("1swVp34va3fMsqgrQUiZ54c6xINtVcvAw"),
  bcaMca: sheet("1bgt36hHBQNYLOND4H-cvZBoRoLVjNa38"),
  biotech: sheet("12y1NWWOzYzXW2JmaB8mGx94lSCKSDcjx"),
  business: sheet("1NKY-RClRP8XMRVaQs1hNwdiok3q_sxCh"),
  chemistry: sheet("1tC6oOanlHuvzKdmM_mJT2h2cXRl_auK8"),
  cseIt: sheet("1uRhgx-cEnNJtuh1QdauDTPLpscK7aIFb"),
  electrical: sheet("1Gbk-hpC3pKizSbXtXPZTcKh8_TQKrkv4"),
  electronics: sheet("11Qc0ofqZLHdVIh9pVjCrC-5LHBbCs9Ud"),
  finance: sheet("15gz-W9a9WPCvKrKQVIXKwZ6bpX-U8ifa"),
  hrd: sheet("1-tFtLmyOn6VTgBn1M-JIasW00qDS2GLL"),
  humanities: sheet("1aZkrLitIn8FlywBY5z5RvXaneAY9PgUt"),
  law: sheet("1KVBHDxV3Sz2QV5WayGh-eNbMMcFAu1f2"),
  pharmacy: sheet("1bbmWAWVP9ySleWgi3lKo4_lQIM58uYuj"),
  massComm: sheet("129Uoz15jbSYAt1HJ8kixB5B8Qw9lGJ3l"),
  maths: sheet("1ysD7SguicSyVE3NYch_BvbAwTqdUWo8c"),
  mechanical: sheet("1boXamTVD3vtcXsASL_EpYqIHDrGHt4_k"),
  physics: sheet("1x8WOWw9u0iFgLSmUaKrd7JhR8cxjk6Sb"),
  rbNano: sheet("187gwNl8gk6K-lx-ZuUoiGsISZB0OveU_"),
  rbChemistry: sheet("1ox8V_r2ZHCP1NC_wgfNZoNnyfi6cVPK6"),
  rbMaths: sheet("17UBrwlwqyemOAlRwiZts2OQm9ARkRpBT"),
  rbEarth: sheet("1Md4xd5GMBIYv9QXKQ4LTk0gVVgszpn_5"),
  rbPhysics: sheet("1LqtATGqy3PG4FIuw8KHts5MeXkeGcikn"),
  rbRenewable: sheet("1mA-1iXUqknsbP1oZsRMtIu7cfH21ABil"),
};

/** department id -> source sheet. */
export const SOURCE_SHEETS: Record<string, string> = {
  "applied-psychology": S.appliedPsychology,
  "computer-applications": S.bcaMca,
  biotechnology: S.biotech,
  microbiology: S.biotech,
  biochemistry: S.biotech,
  "environmental-studies": S.biotech,
  "business-economics": S.business,
  "business-management": S.business,
  cse: S.cseIt,
  it: S.cseIt,
  chemistry: S.chemistry,
  "electrical-engineering": S.electrical,
  "electronics-engineering": S.electronics,
  "electronics-and-communication-engineering": S.electronics,
  "finance-and-control": S.finance,
  "h-r-d": S.hrd,
  "department-of-humanities-and-social-sciences": S.humanities,
  "department-of-law": S.law,
  "institute-department-of-pharmacy": S.pharmacy,
  "mass-comm-and-journalism": S.massComm,
  "mathematics-engg": S.maths,
  "mechanical-engineering": S.mechanical,
  physics: S.physics,
  "rb-centre-for-nanoscience-and-technology": S.rbNano,
  "rb-chemistry": S.rbChemistry,
  "rb-mathematics": S.rbMaths,
  "rb-earth-and-planetary-sciences": S.rbEarth,
  "rb-physics": S.rbPhysics,
  "rb-centre-for-renewable-energy": S.rbRenewable,
};

export const sourceSheetOf = (deptId: string): string | undefined => SOURCE_SHEETS[deptId];
