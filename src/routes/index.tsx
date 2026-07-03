import { createFileRoute } from "@tanstack/react-router";
import DeadSectorGame from "@/game/DeadSectorGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dead Sector — Top-Down Zombie Shooter" },
      {
        name: "description",
        content:
          "Dead Sector: a top-down zombie shooter with weapon buy stations, main and side quests, and a three-phase underworld boss fight.",
      },
      { property: "og:title", content: "Dead Sector" },
      {
        property: "og:description",
        content:
          "Fight through the sector, complete quests, and face the three-phase underworld boss.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <DeadSectorGame />;
}
