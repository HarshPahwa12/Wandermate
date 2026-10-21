export type Category = "WALK" | "COFFEE" | "FOOD" | "GAMES" | "SPORTS" | "OTHER";
export type RequestStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface User {
  id: number;
  displayName: string;
}

export interface Me {
  id: number;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Trust {
  ratingAverage: number | null;
  ratingCount: number;
  meetupsAttended: number;
  noShows: number;
  memberSince: string;
}

export interface JoinRequestView {
  id: number;
  user: User;
  status: RequestStatus;
  /** True if the host and this requester have blocked each other (visible to the host only). */
  blocked: boolean;
  trust: Trust;
  /** Host's after-the-fact record: true = came, false = no-show, null = not marked. */
  attended: boolean | null;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  sender: User;
  body: string;
  createdAt: string;
}

export interface Conversation {
  id: number;
  type: "PLAN" | "DIRECT";
  title: string;
  planId: number | null;
  other: User | null;
  lastMessage: ChatMessage | null;
  unread: number;
  /** True for a direct chat where either side has blocked the other: the composer should be disabled. */
  blocked: boolean;
}

export interface Plan {
  id: number;
  title: string;
  description: string | null;
  category: Category;
  /** The exact spot if `locationExact`, otherwise just the public area label. */
  placeName: string;
  /** Public neighbourhood label; null on plans created before it existed. */
  areaName: string | null;
  /** False for everyone except the host and accepted guests: lat/lng are then rounded to ~1 km. */
  locationExact: boolean;
  lat: number;
  lng: number;
  startsAt: string;
  capacity: number;
  spotsLeft: number;
  host: User;
  distanceKm: number | null;
  isHost: boolean;
  myStatus: RequestStatus | null;
  requests: JoinRequestView[] | null;
  /** Ids this viewer has already rated for this plan (null unless fetched via the detail endpoint). */
  ratedUserIds: number[] | null;
}

export interface RatingSummary {
  average: number | null;
  count: number;
}
