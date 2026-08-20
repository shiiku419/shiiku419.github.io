export interface NewsItem {
  date: string; // ISO yyyy-mm-dd
  body: string; // may contain a single inline markdown-style [text](url) link
  link?: { text: string; url: string };
}

// Migrated from the 16 legacy _news/announcement_*.md files, newest first.
export const news: NewsItem[] = [
  {
    date: "2025-09-14",
    body: 'Oral presentation at 15th International Symposium on Computer Science in Sport (IACSS 2025). The title is "Trends and Performance Visualization of Clutch Time in Japan\'s Professional B.League".',
    link: { text: "IACSS 2025", url: "https://iacssconference.org/#/2025" }
  },
  {
    date: "2025-08-02",
    body: 'Poster presentation at CogSci 2025. The title is "The Dynamics of Collective Creativity in Human-AI Hybrid Societies".',
    link: { text: "CogSci 2025", url: "https://cognitivesciencesociety.org/cogsci-2025/" }
  },
  {
    date: "2025-04-06",
    body: 'Paper "The Dynamics of Collective Creativity in Human-AI Social Networks" is accepted by CogSci 2025.',
    link: { text: "CogSci 2025", url: "https://cognitivesciencesociety.org/cogsci-2025/" }
  },
  {
    date: "2025-03-01",
    body: "HAIシンポジウム2025でポスター発表を行いました．タイトルはソーシャルネットワークにおける人間とAIの協働がもたらす集団的創造性．"
  },
  {
    date: "2025-01-11",
    body: "2024年度スポーツデータサイエンスコンペティション審査会でポスター発表を行いました．タイトルはBリーグにおけるクラッチタイムのトレンドおよびパフォーマンスの可視化．"
  },
  {
    date: "2024-12-12",
    body: "電子情報通信学会HCGシンポジウム2024で口頭発表を行いました．タイトルは大規模言語モデルによる小集団の創発的意思決定過程の適応可能性の探究．"
  },
  {
    date: "2024-12-07",
    body: "第22回情報学ワークショップ(WiNF2024)で口頭発表を行いました．タイトルは大規模言語モデルと人間のソーシャルネットワークにおける物語の創造的伝播 - フェイクニュースの文脈での検討 -．",
    link: { text: "site", url: "https://sites.google.com/view/winf2024/program" }
  },
  {
    date: "2024-11-27",
    body: 'Oral presentation at The 12th International Conference on Human-Agent Interaction (HAI 2024). The title is "Exploring the Mutual Adaptation of Large Language Models and Emergent Decision-Making in Simulated Small Group Interactions".'
  },
  {
    date: "2024-08-27",
    body: 'Oral presentation at the 53rd International Congress & Exposition on Noise Control Engineering (Inter-Noise 2024). The title is "Reducing discomfort by integrating unpleasant environmental sounds with cognitive sound control".'
  },
  {
    date: "2024-08-26",
    body: "あいち健康の森プラザホテルで開催された認知的コミュニケーションワークショップ2024で研究発表をしました．"
  },
  {
    date: "2024-07-26",
    body: 'Paper "Exploring the Mutual Adaptation of Large Language Models and Emergent Decision-Making in Simulated Small Group Interactions" is accepted by HAI 2024.',
    link: { text: "HAI 2024", url: "https://hai-conference.net/hai2024/" }
  },
  {
    date: "2024-07-26",
    body: "CogSci Meetup 2024 in Hamamatsuで口頭発表を行いました．Locating self interest in CogSci ~Ongoing Project at Max Planck Institute~．",
    link: { text: "site", url: "https://sites.google.com/view/cogsci-meetup-2024-in-hamamats/" }
  },
  {
    date: "2024-05-31",
    body: "第38回人工知能学会全国大会(2024)で口頭発表を行いました．タイトルは小集団における創発的意見と意思決定過程の強化学習による最適化．",
    link: {
      text: "site",
      url: "https://confit.atlas.jp/guide/event/jsai2024/subject/4R3-OS-8b-04/date?cryptoId="
    }
  },
  {
    date: "2024-04-28",
    body: 'Paper "Reducing Discomfort by Integrating Unpleasant Environmental Sounds with Cognitive Sound Control" is accepted by Inter-Noise 2024.',
    link: { text: "Inter-Noise 2024", url: "https://internoise2024.org/" }
  },
  {
    date: "2024-04-08",
    body: "Start Research Intern at the Max Planck Institute for Empirical Aesthetics in Frankfurt.",
    link: { text: "Max Planck Institute for Empirical Aesthetics", url: "https://www.aesthetics.mpg.de/" }
  },
  {
    date: "2024-03-01",
    body: "INTERACTION2024でポスター発表をしました．インタラクティブ発表賞（PC推薦）を受賞．"
  }
];
