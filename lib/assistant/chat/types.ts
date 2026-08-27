export interface ChatCitation {
  label: string;
  href: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}
