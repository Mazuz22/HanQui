/**
 * Computes the order kanji are introduced in HanQui's lesson path.
 *
 * A kanji shouldn't be taught before the kanji it's visually built from —
 * seeing 明 before either 日 or 月 makes it harder to remember than it needs
 * to be. This is a topological sort over that component-dependency graph
 * (component -> the kanji built from it), using a priority queue instead of
 * a plain FIFO so that among characters that are all ready to be scheduled
 * at once, the easier (lower JLPT tier), more common (lower frequency rank)
 * ones are still preferred. Same technique as the open-source `topokanji`
 * project, adapted here to weight JLPT tier above frequency since tier is
 * the primary curriculum driver in HanQui.
 *
 * Malformed decomposition data can produce a cycle (A depends on B depends
 * on A) that would make a plain topological sort hang forever. Rather than
 * fail the whole build over a handful of bad edges, a cycle is broken by
 * force-scheduling the best-ranked remaining node once the ready queue runs
 * dry — every kanji still ends up in the output exactly once, and the
 * returned cycleBreaks count is a signal for the build report to flag data
 * worth auditing.
 */
export function buildLessonOrder(records) {
  const byChar = new Map(records.map((r) => [r.char, r]))
  const dependents = new Map(records.map((r) => [r.char, []]))
  const inDegree = new Map(records.map((r) => [r.char, 0]))

  for (const record of records) {
    for (const component of record.components) {
      if (!byChar.has(component) || component === record.char) continue
      dependents.get(component).push(record.char)
      inDegree.set(record.char, inDegree.get(record.char) + 1)
    }
  }

  // N5 (level 5, easiest) should sort before N1 (level 1, hardest).
  const tierRank = (jlptLevel) => 5 - jlptLevel

  const compareReady = (a, b) => {
    const ka = byChar.get(a)
    const kb = byChar.get(b)
    return (
      tierRank(ka.jlptLevel) - tierRank(kb.jlptLevel) ||
      (ka.frequencyRank ?? Infinity) - (kb.frequencyRank ?? Infinity) ||
      ka.strokeCount - kb.strokeCount ||
      a.codePointAt(0) - b.codePointAt(0)
    )
  }

  const remaining = new Set(byChar.keys())
  const ready = [...inDegree.entries()].filter(([, degree]) => degree === 0).map(([char]) => char)
  const order = []
  let cycleBreaks = 0

  while (order.length < records.length) {
    if (ready.length === 0) {
      // Nothing has a fully-satisfied dependency set, but kanji remain —
      // the remainder forms one or more cycles. Force the best-ranked one
      // through; its still-unresolved dependents get freed on later passes.
      const forced = [...remaining].sort(compareReady)[0]
      ready.push(forced)
      cycleBreaks += 1
    }

    ready.sort(compareReady)
    const next = ready.shift()
    if (!remaining.has(next)) continue

    remaining.delete(next)
    order.push(next)

    for (const dependent of dependents.get(next)) {
      if (!remaining.has(dependent)) continue
      inDegree.set(dependent, inDegree.get(dependent) - 1)
      if (inDegree.get(dependent) === 0) ready.push(dependent)
    }
  }

  return { order, cycleBreaks }
}
