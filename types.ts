
export enum Tab {
  Home = 'Home',
  Chat = 'Chat',
  Records = 'Records',
  Analysis = 'Analysis',
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface MedicalRecord {
  date: string;
  doctor: string;
  diagnosis: string;
  notes: string;
}
