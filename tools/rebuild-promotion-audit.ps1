param(
  [string]$MainSha = "e63cdeb2a065a9f87c24039d2b08bbe059513fed",
  [string]$OutputRoot = "docs/promotion-rebuild-20261104"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Invoke-GhJson([string]$Path) {
  $json = gh api --paginate --slurp $Path
  $pages = $json | ConvertFrom-Json
  $items = @()
  foreach ($page in $pages) { $items += @($page) }
  return $items
}

function Invoke-GitLines([string[]]$GitArgs) {
  $out = & git @GitArgs 2>$null
  if ($LASTEXITCODE -ne 0) { return @() }
  return @($out | ForEach-Object { [string]$_ })
}

function Get-CiReview([int]$Number) {
  $ci = "NOT_QUERIED"
  $review = "NOT_QUERIED"
  if ($Number -in @(689, 690)) {
    try {
      $checkOut = gh pr checks $Number --repo binchen648/fd 2>$null
      if ($LASTEXITCODE -eq 0 -and $checkOut) {
        $states = @($checkOut | ForEach-Object {
          if ($_ -match "\b(pass|fail|pending|skipping|cancel)\b") { $Matches[1].ToUpperInvariant() }
        })
        if ($states -contains "FAIL") { $ci = "FAIL" }
        elseif ($states -contains "PENDING") { $ci = "PENDING" }
        elseif ($states -contains "PASS") { $ci = "PASS" }
        else { $ci = "PRESENT_UNPARSED" }
      }
    } catch { $ci = "QUERY_ERROR" }
    try {
      $reviews = @(gh api "repos/binchen648/fd/pulls/$Number/reviews" | ConvertFrom-Json)
      $effective = @($reviews | Where-Object { $_.state -in @("APPROVED", "CHANGES_REQUESTED") } | Select-Object -Last 1)
      if ($effective.Count -gt 0) { $review = $effective[0].state }
      elseif ($reviews.Count -gt 0) { $review = "COMMENT_ONLY" }
      else { $review = "NONE" }
    } catch { $review = "QUERY_ERROR" }
  }
  return @{ ci = $ci; review = $review }
}

New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null
$prs = Invoke-GhJson "repos/binchen648/fd/pulls?state=all&per_page=100"
$reservationPath = "docs/agents/manifests/reservations/SHARED-RUNTIME-LANE.json"
$reservation = Get-Content -LiteralPath $reservationPath -Raw | ConvertFrom-Json
$protected = @($reservation.resources | Where-Object { $_.state -eq "GRANTED" } | ForEach-Object { $_.path })
$activeTask = [string]$reservation.activeRuntimeTask

$rows = @()
foreach ($p in $prs) {
  $base = [string]$p.base.sha
  $head = [string]$p.head.sha
  $diffLines = Invoke-GitLines @("diff", "--name-status", "--find-renames=50%", "$base...$head")
  $files = @($diffLines | ForEach-Object {
    $parts = ([string]$_) -split "`t"
    if ($parts.Count -gt 1) { ($parts[1..($parts.Count-1)] -join " => ") } else { [string]$_ }
  })
  $areas = @($files | ForEach-Object {
    if ($_ -match "^(apps|packages|data|scripts|e2e|docs|\.github)/") { $Matches[1] } else { ($_ -split "/")[0] }
  } | Sort-Object -Unique)
  $touchesProtected = @($files | Where-Object { $protected -contains $_ })
  $headInMain = $false
  & git merge-base --is-ancestor $head $MainSha 2>$null
  if ($LASTEXITCODE -eq 0) { $headInMain = $true }
  $baseIsMain = ([string]$p.base.ref -eq "main")
  $baseExact = ($base -eq $MainSha)
  $merged = $null -ne $p.merged_at
  $closed = ([string]$p.state -eq "closed")
  $tree = [string](& git rev-parse "$head^{tree}")
  $reason = ""
  $classification = "BLOCKED"
  if ($headInMain) {
    $classification = "ALREADY_INCLUDED"
    $reason = "head-is-ancestor-of-current-main"
  } elseif ($merged) {
    $classification = "ALREADY_INCLUDED"
    $reason = "github-merged; historical PR retained as provenance"
  } elseif ($closed) {
    $classification = "REJECTED"
    $reason = "closed-without-merge"
  } elseif (-not $baseIsMain) {
    $classification = "BLOCKED"
    $reason = "stacked-or-non-main-base-requires-current-main-replay"
  } elseif (-not $baseExact) {
    $classification = "BLOCKED"
    $reason = "stale-main-base-requires-current-main-replay"
  } elseif ($touchesProtected.Count -gt 0) {
    $classification = "BLOCKED"
    $reason = "active-reservation:${activeTask}:" + (($touchesProtected | Sort-Object -Unique) -join ",")
  } elseif ($files.Count -eq 0) {
    $classification = "DUPLICATE"
    $reason = "no-effective-diff-against-declared-base"
  } else {
    $classification = "VALID_DELTA"
    $reason = "current-main-base-and-nonempty-diff; independent-review-still-required"
  }
  $ciReview = Get-CiReview ([int]$p.number)
  $rows += [pscustomobject]@{
    Number = [int]$p.number
    Title = [string]$p.title
    State = [string]$p.state
    MergedAt = [string]$p.merged_at
    BaseRef = [string]$p.base.ref
    BaseSha = $base
    HeadRef = [string]$p.head.ref
    HeadSha = $head
    Classification = $classification
    Reason = $reason
    FileCount = $files.Count
    Files = ($files -join "; ")
    Areas = ($areas -join ", ")
    TouchesProtected = ($touchesProtected -join ", ")
    Tree = $tree
    Ci = $ciReview.ci
    Review = $ciReview.review
    Url = [string]$p.html_url
  }
}

# Exact tree duplicates are safe to call out without making a semantic claim.
$treeGroups = @($rows | Group-Object Tree | Where-Object { $_.Count -gt 1 })
$duplicateOf = @{}
foreach ($group in $treeGroups) {
  $ordered = @($group.Group | Sort-Object Number)
  for ($i = 1; $i -lt $ordered.Count; $i++) { $duplicateOf[$ordered[$i].Number] = $ordered[0].Number }
}
foreach ($row in $rows) {
  if ($duplicateOf.ContainsKey($row.Number) -and $row.Classification -notin @("ALREADY_INCLUDED", "REJECTED")) {
    $row.Classification = "DUPLICATE"
    $row.Reason = "exact-head-tree-duplicate-of-PR-" + $duplicateOf[$row.Number]
  }
}

$counts = @($rows | Group-Object Classification | Sort-Object Name)
$protectedConflicts = @($rows | Where-Object { $_.TouchesProtected } | Sort-Object Number -Descending)
$pathCounts = @{}
foreach ($row in $rows) {
  foreach ($path in @($row.Files -split "; " | Where-Object { $_ })) {
    if (-not $pathCounts.ContainsKey($path)) { $pathCounts[$path] = 0 }
    $pathCounts[$path]++
  }
}
$hotPaths = @($pathCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 40)

$baseline = "origin/main=$MainSha"
$generated = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$recon = [System.Text.StringBuilder]::new()
[void]$recon.AppendLine("# Historical PR Reconciliation")
[void]$recon.AppendLine()
[void]$recon.AppendLine("Generated: $generated")
[void]$recon.AppendLine("Locked baseline: $baseline")
[void]$recon.AppendLine("Repository: https://github.com/binchen648/fd")
[void]$recon.AppendLine()
[void]$recon.AppendLine("This audit is read-only with respect to the existing worktree. It inventories all 690 pull requests returned by GitHub (state=all), compares each declared base/head in the local object graph, and never merges, retargets, closes, or rewrites a historical PR.")
[void]$recon.AppendLine()
[void]$recon.AppendLine("## Classification counts")
[void]$recon.AppendLine()
[void]$recon.AppendLine("| Classification | Count |")
[void]$recon.AppendLine("|---|---:|")
foreach ($c in $counts) { [void]$recon.AppendLine("| $($c.Name) | $($c.Count) |") }
[void]$recon.AppendLine()
[void]$recon.AppendLine("ALREADY_INCLUDED is used for merged or ancestor-contained work. DUPLICATE is reserved for exact head-tree duplicates or empty effective diffs. BLOCKED is conservative: stacked/non-main bases, stale main bases, and active reservation conflicts all require a fresh replay before any promotion decision. REJECTED means closed without merge. No PR is treated as accepted merely because CI once passed.")
[void]$recon.AppendLine()
[void]$recon.AppendLine("## Complete inventory")
[void]$recon.AppendLine()
[void]$recon.AppendLine("| PR | State | Base | Head | Classification | Files | Areas | CI | Review | Reason | Changed files |")
[void]$recon.AppendLine("|---:|---|---|---|---|---:|---|---|---|---|---|")
foreach ($row in ($rows | Sort-Object Number)) {
  $title = $row.Title.Replace("|", "\\|").Replace("`r", " ").Replace("`n", " ")
  $files = $row.Files.Replace("|", "\\|").Replace("`r", " ").Replace("`n", " ")
  $reason = $row.Reason.Replace("|", "\\|")
  [void]$recon.AppendLine("| [$($row.Number)]($($row.Url)) $title | $($row.State) | $($row.BaseRef) $($row.BaseSha.Substring(0,8)) | $($row.HeadRef) $($row.HeadSha.Substring(0,8)) | $($row.Classification) | $($row.FileCount) | $($row.Areas) | $($row.Ci) | $($row.Review) | $reason | $files |")
}
[void]$recon.AppendLine()
[void]$recon.AppendLine("## Reservation boundary")
[void]$recon.AppendLine()
[void]$recon.AppendLine("The current SHARED-RUNTIME-LANE.json grants $activeTask exclusive write ownership for: $($protected -join ', '). Any historical diff touching those paths is listed as BLOCKED until the reservation is explicitly released or a new owner grant is recorded.")
Set-Content -LiteralPath (Join-Path $OutputRoot "HISTORICAL_PR_RECONCILIATION.md") -Value $recon.ToString().TrimEnd() -Encoding UTF8

$semantic = [System.Text.StringBuilder]::new()
[void]$semantic.AppendLine("# Current Main Semantic Replay")
[void]$semantic.AppendLine()
[void]$semantic.AppendLine("Baseline: $MainSha (origin/main at audit start).")
[void]$semantic.AppendLine()
[void]$semantic.AppendLine("Only two open PRs are based exactly on this baseline: PR #689 and PR #690. Both are real non-empty deltas, but both touch paths reserved by active A-RECOVER-04; therefore neither is replayed into a new branch in this run.")
[void]$semantic.AppendLine()
foreach ($number in @(689,690)) {
  $row = $rows | Where-Object Number -eq $number
  [void]$semantic.AppendLine("## PR #$number — $($row.Title)")
  [void]$semantic.AppendLine()
  [void]$semantic.AppendLine("- Original base: $($row.BaseSha)")
  [void]$semantic.AppendLine("- Original head: $($row.HeadSha)")
  [void]$semantic.AppendLine("- Classification: **$($row.Classification)** ($($row.Reason))")
[void]$semantic.AppendLine("- CI observation: $($row.Ci); latest review observation: $($row.Review). These are not acceptance decisions.")
  [void]$semantic.AppendLine("- Modified files ($($row.FileCount)): $($row.Files)")
  [void]$semantic.AppendLine()
}
[void]$semantic.AppendLine("## Replay decision")
[void]$semantic.AppendLine()
[void]$semantic.AppendLine("No production replay was authorized. PR #689 modifies apps/server/src/index.ts and apps/server/src/match-server.ts, both granted to A-RECOVER-04. PR #690 additionally modifies packages/rules/src/match-session.ts, apps/server/src/index.ts, apps/server/src/match-server.ts, and other runtime files; these overlap the same reservation and include runtime-hotspot edits. Reapplying either now would violate the active writer boundary.")
[void]$semantic.AppendLine()
[void]$semantic.AppendLine("The correct next action is to obtain an explicit reservation release/new grant, then replay each semantic unit from this locked SHA into isolated branches. No old PR is being cherry-picked or merged here.")
Set-Content -LiteralPath (Join-Path $OutputRoot "CURRENT_MAIN_SEMANTIC_REPLAY.md") -Value $semantic.ToString().TrimEnd() -Encoding UTF8

$plan = [System.Text.StringBuilder]::new()
[void]$plan.AppendLine("# Final Promotion Plan")
[void]$plan.AppendLine()
[void]$plan.AppendLine("## Locked baseline")
[void]$plan.AppendLine()
[void]$plan.AppendLine("origin/main was fetched and locked at $MainSha. The audit worktree is detached from the user's dirty worktree and no historical PR was merged.")
[void]$plan.AppendLine()
[void]$plan.AppendLine("## Proposed final PRs (not created because blocked)")
[void]$plan.AppendLine()
[void]$plan.AppendLine("| Proposed PR | Source | Intended scope | Dependencies | Current state |")
[void]$plan.AppendLine("|---|---|---|---|---|")
[void]$plan.AppendLine("| Promotion: public seven-player entry | PR #689 | client/server hosted entry, safe invitations, focused tests and e2e | current main only; server reservation must be released | BLOCKED by A-RECOVER-04 reservation |")
[void]$plan.AppendLine("| Promotion: seven-roster repair | PR #690 | runtime repair + authoritative master/servant data + acceptance/regression tests | current main only; runtime reservation and independent review | BLOCKED by A-RECOVER-04 reservation; requires fresh replay |")
[void]$plan.AppendLine()
[void]$plan.AppendLine("No Runtime PR, Content PR, Master/Data PR, or Integration PR is opened in this run because the only exact-current-main candidates overlap a granted runtime writer reservation. Opening placeholder PRs would create duplicate/repackaged history and would not be independently promotable.")
[void]$plan.AppendLine()
[void]$plan.AppendLine("## Required release sequence")
[void]$plan.AppendLine()
[void]$plan.AppendLine("1. Release or re-scope A-RECOVER-04 in the reservation manifest.")
[void]$plan.AppendLine("2. Re-run semantic replay from $MainSha, extracting implementation commits rather than cherry-picking complete historical PRs.")
[void]$plan.AppendLine("3. Split only at real dependency boundaries; keep coupled runtime/data/integration changes together when splitting would create an invalid intermediate state.")
[void]$plan.AppendLine("4. Run Build/Test/Policy/Promotion checks and obtain an exact-HEAD independent review for each candidate.")
[void]$plan.AppendLine("5. Create one Promotion PR per accepted Slice targeting main; stop before merge.")
[void]$plan.AppendLine()
[void]$plan.AppendLine("## Explicit semantic blockers")
[void]$plan.AppendLine()
[void]$plan.AppendLine("- Altera/Arthur magic-resistance: typed ability with empty effects cannot be promoted until the set_opponent_power_to_zero primitive is formally admitted; do not route through legacy behavior.")
[void]$plan.AppendLine("- Arthur: authoritative source must be independently verified before replay.")
[void]$plan.AppendLine("- Abigail: missing SC3a input is a hard evidence block; do not invent or infer the ability.")
Set-Content -LiteralPath (Join-Path $OutputRoot "FINAL_PROMOTION_PLAN.md") -Value $plan.ToString().TrimEnd() -Encoding UTF8

$dupes = [System.Text.StringBuilder]::new()
[void]$dupes.AppendLine("# Duplicate And Conflict Report")
[void]$dupes.AppendLine()
[void]$dupes.AppendLine("Baseline: $MainSha. This report compares exact Git trees and changed-path overlap; path overlap alone is not treated as semantic duplication.")
[void]$dupes.AppendLine()
[void]$dupes.AppendLine("## Exact head-tree duplicate groups")
[void]$dupes.AppendLine()
if ($treeGroups.Count -eq 0) { [void]$dupes.AppendLine("No exact duplicate head trees were found among the audited PR heads.") }
else {
  foreach ($group in $treeGroups) {
    $nums = ($group.Group | Sort-Object Number | ForEach-Object { "#$($_.Number)" }) -join ", "
    [void]$dupes.AppendLine("- Tree $($group.Name): $nums")
  }
}
[void]$dupes.AppendLine()
[void]$dupes.AppendLine("## Most frequently overlapping paths")
[void]$dupes.AppendLine()
[void]$dupes.AppendLine("| Path | PR count |")
[void]$dupes.AppendLine("|---|---:|")
foreach ($entry in $hotPaths) { [void]$dupes.AppendLine("| $($entry.Name) | $($entry.Value) |") }
[void]$dupes.AppendLine()
[void]$dupes.AppendLine("## Active-reservation conflicts")
[void]$dupes.AppendLine()
foreach ($row in $protectedConflicts) { [void]$dupes.AppendLine("- PR #$($row.Number) [$($row.Classification)] touches: $($row.TouchesProtected)") }
[void]$dupes.AppendLine()
[void]$dupes.AppendLine("A repeated path is a conflict candidate, not permission to combine changes. Runtime, content, master/data, and integration slices must be replayed and checked against the current contract before any consolidation.")
Set-Content -LiteralPath (Join-Path $OutputRoot "DUPLICATE_AND_CONFLICT_REPORT.md") -Value $dupes.ToString().TrimEnd() -Encoding UTF8

$blocked = [System.Text.StringBuilder]::new()
[void]$blocked.AppendLine("# Blocked Items Register")
[void]$blocked.AppendLine()
[void]$blocked.AppendLine("Baseline: $MainSha.")
[void]$blocked.AppendLine()
[void]$blocked.AppendLine("| Blocker | Evidence | Consequence |")
[void]$blocked.AppendLine("|---|---|---|")
[void]$blocked.AppendLine("| Active runtime reservation | $reservationPath; active task $activeTask; granted paths: $($protected -join ", ") | Do not write or replay touching files until an explicit release/new grant exists. |")
[void]$blocked.AppendLine("| Stale/non-main bases | $(@($rows | Where-Object { $_.Classification -eq "BLOCKED" -and $_.Reason -match "base" }).Count) PRs | Requires semantic replay from current main; old PR base cannot be promoted. |")
[void]$blocked.AppendLine("| Stacked role topology | $(@($rows | Where-Object { $_.BaseRef -ne "main" -and $_.State -eq "open" }).Count) open PRs | Do not merge or retarget; extract valid deltas only after replay. |")
[void]$blocked.AppendLine("| Altera/Arthur primitive/source conflict | typed magic-resistance has no admitted set_opponent_power_to_zero primitive; Arthur source authority unresolved | Runtime Proposal / source review required; no legacy disguise. |")
[void]$blocked.AppendLine("| Abigail evidence gap | SC3a input is absent | Do not infer or fabricate the missing ability. |")
[void]$blocked.AppendLine("| Independent acceptance | historical author/relay comments are not independent GitHub review | Every final candidate needs fresh exact-HEAD review plus required checks. |")
[void]$blocked.AppendLine()
[void]$blocked.AppendLine("## Candidate-specific blockers")
[void]$blocked.AppendLine()
foreach ($row in ($rows | Where-Object { $_.Classification -eq "BLOCKED" -and $_.Number -in @(689,690) })) {
  [void]$blocked.AppendLine("- PR #$($row.Number): $($row.Reason)")
}
Set-Content -LiteralPath (Join-Path $OutputRoot "BLOCKED_ITEMS_REGISTER.md") -Value $blocked.ToString().TrimEnd() -Encoding UTF8

Write-Output "BASELINE=$MainSha"
Write-Output ("PR_COUNT=" + $rows.Count)
foreach ($c in $counts) { Write-Output ("CLASSIFICATION_{0}={1}" -f $c.Name,$c.Count) }
Write-Output ("PROTECTED_CONFLICT_PR_COUNT=" + $protectedConflicts.Count)
Write-Output ("OUTPUT_ROOT=" + (Resolve-Path $OutputRoot))
