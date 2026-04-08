export type Grammar = {
  variables: Set<string>;
  terminals: Set<string>;
  rules: Record<string, string[][]>;
  startSymbol: string;
};

export type DerivationStep = {
  nt: string;
  rhs: string[];
};

export type TreeNode = {
  id: number;
  name: string;
  children?: TreeNode[];
  ruleApplied?: string;
};

export type DerivationSequenceStep = {
  form: string[];
  rule?: string;
};

export function parseGrammar(text: string): Grammar {
  const rules: Record<string, string[][]> = {};
  let startSymbol = '';
  const variables = new Set<string>();
  const rhsLines: { lhs: string, rhsRaw: string }[] = [];

  // First pass: collect all variables from LHS
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/(?:->|→)/);
    if (parts.length !== 2) continue;

    const lhs = parts[0].trim();
    if (!startSymbol) startSymbol = lhs;
    variables.add(lhs);
    rhsLines.push({ lhs, rhsRaw: parts[1] });
  }

  const symbolsInRhs = new Set<string>();

  // Second pass: parse RHS using collected variables
  for (const { lhs, rhsRaw } of rhsLines) {
    if (!rules[lhs]) rules[lhs] = [];

    const rhsAlternatives = rhsRaw.split('|');
    for (const alt of rhsAlternatives) {
      const trimmedAlt = alt.trim();
      let symbols: string[] = [];

      if (/\s+/.test(trimmedAlt)) {
        // If it contains spaces, trust the user's spacing
        symbols = trimmedAlt.split(/\s+/).filter(s => s.length > 0);
      } else if (trimmedAlt.length > 0) {
        // Otherwise, try to tokenize based on variables
        let i = 0;
        const sortedVars = Array.from(variables).sort((a, b) => b.length - a.length);
        
        while (i < trimmedAlt.length) {
          let matched = false;
          for (const v of sortedVars) {
            if (trimmedAlt.startsWith(v, i)) {
              symbols.push(v);
              i += v.length;
              matched = true;
              break;
            }
          }
          if (!matched) {
            symbols.push(trimmedAlt[i]);
            i++;
          }
        }
      }

      const cleanSymbols = symbols.length === 1 && (symbols[0] === 'ε' || symbols[0] === "''" || symbols[0] === '""') ? [] : symbols;
      rules[lhs].push(cleanSymbols);
      cleanSymbols.forEach(s => symbolsInRhs.add(s));
    }
  }

  const terminals = new Set<string>();
  symbolsInRhs.forEach(s => {
    if (!variables.has(s)) terminals.add(s);
  });

  return { variables, terminals, rules, startSymbol };
}

export function findDerivations(grammar: Grammar, target: string, limit: number = 2): DerivationStep[][] {
  const targetStr = target.replace(/\s+/g, '');
  const successfulDerivations: DerivationStep[][] = [];

  // Use a queue for BFS
  const queue: { form: string[], steps: DerivationStep[] }[] = [];
  queue.push({ form: [grammar.startSymbol], steps: [] });

  let iterations = 0;
  const MAX_ITERATIONS = 100000; // Increased for complex grammars

  while (queue.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    const { form, steps } = queue.shift()!;

    const firstNtIndex = form.findIndex(sym => grammar.variables.has(sym));

    if (firstNtIndex === -1) {
      if (form.join('') === targetStr) {
        successfulDerivations.push(steps);
        if (successfulDerivations.length >= limit) return successfulDerivations;
      }
      continue;
    }

    // Pruning: check if the prefix of terminals matches the target
    const prefix = form.slice(0, firstNtIndex).join('');
    if (!targetStr.startsWith(prefix)) continue;
    
    // Pruning: if terminal count already exceeds target length
    const terminalsCount = form.filter(sym => !grammar.variables.has(sym)).length;
    if (terminalsCount > targetStr.length) continue;

    // Pruning: heuristic to prevent infinite loops or excessively deep searches
    // For grammars without epsilon rules, form.length shouldn't grow much beyond targetStr.length
    // We allow some buffer for variables that might expand.
    if (form.length > targetStr.length + 15) continue;

    const nt = form[firstNtIndex];
    const alternatives = grammar.rules[nt] || [];

    for (const rhs of alternatives) {
      const newForm = [...form.slice(0, firstNtIndex), ...rhs, ...form.slice(firstNtIndex + 1)];
      queue.push({
        form: newForm,
        steps: [...steps, { nt, rhs }]
      });
    }
  }

  return successfulDerivations;
}

export function buildParseTree(startSymbol: string, steps: DerivationStep[]): TreeNode {
  let idCounter = 1;
  const root: TreeNode = { id: idCounter++, name: startSymbol };
  const frontier: TreeNode[] = [root];

  for (const step of steps) {
    const nodeIndex = frontier.findIndex(n => n.name === step.nt && !n.children);
    if (nodeIndex !== -1) {
      const node = frontier[nodeIndex];
      const rhsStr = step.rhs.length === 0 ? 'ε' : step.rhs.join(' ');
      node.ruleApplied = `${step.nt} → ${rhsStr}`;
      if (step.rhs.length === 0) {
        node.children = [{ id: idCounter++, name: 'ε' }];
        frontier.splice(nodeIndex, 1);
      } else {
        node.children = step.rhs.map(sym => ({ id: idCounter++, name: sym }));
        frontier.splice(nodeIndex, 1, ...node.children);
      }
    }
  }

  return root;
}

export function generateLMD(root: TreeNode): DerivationSequenceStep[] {
  const sequences: DerivationSequenceStep[] = [];
  const frontier: TreeNode[] = [root];
  
  sequences.push({ form: [root.name] });

  while (true) {
    const ntIndex = frontier.findIndex(n => n.children);
    if (ntIndex === -1) break;

    const node = frontier[ntIndex];
    const rule = node.ruleApplied;
    frontier.splice(ntIndex, 1, ...(node.children || []));
    sequences.push({ 
      form: frontier.map(n => n.name).filter(n => n !== 'ε'),
      rule 
    });
  }
  return sequences;
}

export function generateRMD(root: TreeNode): DerivationSequenceStep[] {
  const sequences: DerivationSequenceStep[] = [];
  const frontier: TreeNode[] = [root];
  sequences.push({ form: [root.name] });

  while (true) {
    let ntIndex = -1;
    for (let i = frontier.length - 1; i >= 0; i--) {
      if (frontier[i].children) {
        ntIndex = i;
        break;
      }
    }
    if (ntIndex === -1) break;

    const node = frontier[ntIndex];
    const rule = node.ruleApplied;
    frontier.splice(ntIndex, 1, ...(node.children || []));
    sequences.push({ 
      form: frontier.map(n => n.name).filter(n => n !== 'ε'),
      rule 
    });
  }
  return sequences;
}
