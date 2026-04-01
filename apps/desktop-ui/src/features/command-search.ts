export type CommandSearchItem<TAction = () => void> = {
  id: string;
  label: string;
  group: string;
  hotkey?: string;
  keywords: string[];
  action: TAction;
};

export type RankedCommand<TAction = () => void> = CommandSearchItem<TAction> & {
  score: number;
  labelMatchIndex: number;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function tokenize(value: string) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function startsWithBonus(candidate: string, token: string) {
  return candidate.startsWith(token) ? 28 : 0;
}

function includesScore(candidate: string, token: string) {
  const index = candidate.indexOf(token);
  if (index < 0) {
    return { score: 0, index: Number.POSITIVE_INFINITY };
  }
  const score = 20 - Math.min(18, index);
  return { score, index };
}

function scoreToken<TAction>(entry: CommandSearchItem<TAction>, token: string) {
  const inLabel = includesScore(normalize(entry.label), token);
  const inGroup = includesScore(normalize(entry.group), token);

  let keywordScore = 0;
  for (const keyword of entry.keywords) {
    const normalizedKeyword = normalize(keyword);
    const candidate = includesScore(normalizedKeyword, token);
    keywordScore = Math.max(keywordScore, candidate.score);
    if (normalizedKeyword === token) {
      keywordScore = Math.max(keywordScore, 24);
    }
  }

  const hotkeyScore = entry.hotkey && normalize(entry.hotkey).includes(token) ? 12 : 0;
  const labelPrefix = startsWithBonus(normalize(entry.label), token);
  const groupPrefix = startsWithBonus(normalize(entry.group), token) > 0 ? 8 : 0;

  const tokenScore = inLabel.score + inGroup.score + keywordScore + hotkeyScore + labelPrefix + groupPrefix;
  return {
    score: tokenScore,
    labelIndex: inLabel.index,
  };
}

export function rankCommands<TAction = () => void>(
  query: string,
  commands: CommandSearchItem<TAction>[],
): RankedCommand<TAction>[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return commands.map((command) => ({ ...command, score: 1, labelMatchIndex: Number.POSITIVE_INFINITY }));
  }

  const ranked: RankedCommand<TAction>[] = [];

  for (const command of commands) {
    let aggregate = 0;
    let bestLabelIndex = Number.POSITIVE_INFINITY;
    let matchedTokens = 0;

    for (const token of tokens) {
      const tokenResult = scoreToken(command, token);
      if (tokenResult.score <= 0) {
        continue;
      }
      aggregate += tokenResult.score;
      bestLabelIndex = Math.min(bestLabelIndex, tokenResult.labelIndex);
      matchedTokens += 1;
    }

    if (matchedTokens === 0) {
      continue;
    }

    const fullTokenMatchBonus = matchedTokens === tokens.length ? 36 : 0;
    const score = aggregate + fullTokenMatchBonus;
    ranked.push({ ...command, score, labelMatchIndex: bestLabelIndex });
  }

  ranked.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    if (a.labelMatchIndex !== b.labelMatchIndex) {
      return a.labelMatchIndex - b.labelMatchIndex;
    }
    return a.label.localeCompare(b.label);
  });

  return ranked;
}

export function groupRankedCommands<TAction = () => void>(ranked: RankedCommand<TAction>[]) {
  const groups = new Map<string, RankedCommand<TAction>[]>();
  for (const command of ranked) {
    const existing = groups.get(command.group);
    if (existing) {
      existing.push(command);
    } else {
      groups.set(command.group, [command]);
    }
  }
  return Array.from(groups.entries()).map(([group, commands]) => ({ group, commands }));
}
