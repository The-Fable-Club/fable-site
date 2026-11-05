// The questions each team asks on the application form, read from content/teams.json at build
// time, so the browser and the server check against the same list (fable-site#24).
import data from "../../content/teams.json";

const byTeam = new Map(data.teams.map((t) => [t.name, t.questions ?? []]));

/** What someone who picked this team is asked: the team's own questions, then the ones everyone answers. */
export function questionsFor(team: string): string[] {
  const own = byTeam.get(team);
  return own ? [...own, ...data.everyone] : [];
}
