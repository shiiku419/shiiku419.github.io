export interface Award {
  title: string;
  organization: string;
  year: number;
  detail?: string;
}

export const awards: Award[] = [
  {
    title: "JSAI Annual Conference Award",
    organization: "Japanese Society for Artificial Intelligence (JSAI)",
    year: 2026,
    detail:
      "For the oral presentation 人とAIの共創社会における集団的創造性 (Collective Creativity in Human–AI Co-Creative Societies)."
  },
  {
    title: "Interactive Presentation Award",
    organization: "Interaction 2024 (IPSJ Symposium)",
    year: 2024,
    detail: "For 自己効力感の獲得による不快音の認知的マスキング (Shota Shiiku and Yugo Takeuchi)."
  }
];
