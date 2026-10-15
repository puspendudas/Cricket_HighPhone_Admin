export interface ExtractedTeam {
  sid: number;
  name: string;
}

/**
 * Extracts unique team names and selection IDs from a match object using all available sources
 */
export function extractTeamsFromMatchData(match: any, includeDraw = false): ExtractedTeam[] {
  if (!match) return [];

  const teamMap = new Map<string, ExtractedTeam>();

  const addTeam = (name: any, sid?: number | string) => {
    if (!name) return;
    const cleanName = String(name).trim().replace(/\.+$/, '');
    if (!cleanName || cleanName.toLowerCase() === 'unknown') return;

    const key = cleanName.toLowerCase();
    if (!teamMap.has(key)) {
      const parsedSid = sid != null && !Number.isNaN(Number(sid)) && Number(sid) > 0 ? Number(sid) : teamMap.size + 1;
      teamMap.set(key, {
        sid: parsedSid,
        name: cleanName,
      });
    }
  };

  // 1. Check match.teams (array of strings or objects)
  if (Array.isArray(match.teams) && match.teams.length > 0) {
    match.teams.forEach((item: any, idx: number) => {
      if (typeof item === 'string') {
        addTeam(item, idx + 1);
      } else if (item && typeof item === 'object') {
        const tName = item.name || item.teamName || item.rname || item.team || item.runnerName;
        const tSid = item.sid || item.selectionId || idx + 1;
        if (tName) addTeam(tName, tSid);
      }
    });
  }

  // 2. Check bookMakerOdds
  if (Array.isArray(match.bookMakerOdds)) {
    match.bookMakerOdds.forEach((bm: any) => {
      const markets = [bm?.bm1, bm?.bm2, bm?.bm3, bm].filter(Boolean);
      markets.forEach((mkt: any) => {
        if (Array.isArray(mkt?.oddDatas)) {
          mkt.oddDatas.forEach((odd: any, idx: number) => {
            const name = odd?.rname || odd?.name || odd?.team_name;
            if (name) addTeam(name, odd?.sid || idx + 1);
          });
        }
      });
    });
  }

  // 3. Check matchOdds
  if (Array.isArray(match.matchOdds)) {
    match.matchOdds.forEach((mo: any) => {
      if (Array.isArray(mo?.oddDatas)) {
        mo.oddDatas.forEach((odd: any, idx: number) => {
          const name = odd?.rname || odd?.name || odd?.team_name;
          if (name) addTeam(name, odd?.sid || idx + 1);
        });
      }
    });
  }

  // 4. Check runnerName1, runnerName2, runnerName3
  if (match.runnerName1) addTeam(match.runnerName1, 1);
  if (match.runnerName2) addTeam(match.runnerName2, 2);
  if (match.runnerName3) addTeam(match.runnerName3, 3);

  // 5. Check eventName (e.g. "England U19 v Pakistan U19" or "Team A vs Team B")
  if (teamMap.size === 0 && match.eventName) {
    const parts = String(match.eventName).split(/\s+(?:vs?|v|\/)\s+/i);
    if (parts.length >= 2) {
      parts.forEach((p, idx) => {
        if (p.trim()) addTeam(p.trim(), idx + 1);
      });
    }
  }

  const result = Array.from(teamMap.values());

  // 6. Check includeDraw
  if (includeDraw && !result.some((t) => t.name.toLowerCase() === 'the draw')) {
    result.push({ sid: result.length + 1, name: 'The Draw' });
  }

  return result;
}
