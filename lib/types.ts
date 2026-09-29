export type Status = "posted" | "drafted" | "needs_facts" | "idea";

export type Section =
  | "facebook"
  | "linkedin"
  | "she_came"
  | "portraits"
  | "hijoltola";

export type ContentLanguage = "bn" | "en";

export interface ContentItem {
  id: string;
  section: Section;
  order: number;
  title: string;
  type: string;
  status: Status;
  notes: string;
  text: string;
  language: ContentLanguage;
  updatedAt: number;
}

export const SECTION_LABEL: Record<Section, string> = {
  facebook: "Facebook",
  linkedin: "LinkedIn",
  she_came: "She came",
  portraits: "Portraits",
  hijoltola: "হিজলতলা",
};

export const SECTION_LANGUAGE: Record<Section, ContentLanguage> = {
  facebook: "bn",
  linkedin: "en",
  she_came: "bn",
  portraits: "bn",
  hijoltola: "bn",
};

export const STATUS_LABEL: Record<Status, string> = {
  posted: "Posted",
  drafted: "Drafted",
  needs_facts: "Needs facts",
  idea: "Idea",
};
