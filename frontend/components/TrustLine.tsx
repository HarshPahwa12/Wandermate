import type { Trust } from "@/lib/types";

/** One-line reputation summary shown to a host next to a join request. */
export default function TrustLine({ trust }: { trust: Trust }) {
  const since = new Date(trust.memberSince).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  const isNew = trust.meetupsAttended === 0 && trust.ratingCount === 0;
  return (
    <p className="text-xs text-black/50 dark:text-white/50">
      {trust.ratingAverage != null ? `⭐ ${trust.ratingAverage.toFixed(1)} (${trust.ratingCount})` : "No ratings yet"}
      {" · "}
      {trust.meetupsAttended} {trust.meetupsAttended === 1 ? "meetup" : "meetups"}
      {trust.noShows > 0 && (
        <span className="font-medium text-red-600">
          {" · "}
          {trust.noShows} no-{trust.noShows === 1 ? "show" : "shows"}
        </span>
      )}
      {" · member since "}
      {since}
      {isNew && " · new here"}
    </p>
  );
}
