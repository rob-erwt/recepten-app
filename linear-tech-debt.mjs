#!/usr/bin/env node
/**
 * ReceptenApp – technische verbeterpunten importeren in Linear
 *
 * Gebruik:
 *   export LINEAR_API_KEY=lin_api_xxxxxxxxxxxx
 *   node linear-tech-debt.mjs
 *
 * Status:
 *   ✅ T-01: Opgelost in commit c722fac
 *   ✅ T-02: Opgelost in commit 0d68e07 (sla_recept_op RPC functie)
 *   ❌ T-03: Open
 *   ⚠️  T-04: Voorgesteld (consolidatie migratiebestanden)
 */

const API_KEY = process.env.LINEAR_API_KEY
const GEWENST_TEAM = process.env.LINEAR_TEAM_NAME ?? null

if (!API_KEY) {
  console.error('\u274c  Geen API-key gevonden. Zet eerst:\n   export LINEAR_API_KEY=lin_api_xxxxxxxxxxxx')
  process.exit(1)
}

const ISSUES = [
  {
    title: '[T-03] Type-veilige Supabase-queries via CLI-codegeneratie',
    priority: 2,  // Verhoogd van 3 naar 2 nu T-01 en T-02 opgelost zijn
    label: 'Tech debt',
    description: `## Probleem
Op meerdere plekken wordt TypeScript bewust omzeild voor geneste Supabase-joins:

\`\`\`ts
// Voorbeelden van unsafe casts in ReceptenLijst.tsx
((r.recept_categorieen ?? []) as unknown as { categorieen: ... }[])
entry.recepten as unknown as ReceptKaart | null
\`\`\`

Dit verbergt typefouten en maakt schema-wijzigingen onzichtbaar voor de compiler.

## Oplossing
Genereer typedefinities automatisch met de Supabase CLI:
\`\`\`bash
supabase gen types typescript --project-id <id> > lib/database.types.ts
\`\`\`
Gebruik de gegenereerde types in queries zodat join-structuren exact overeenkomen met de query-output. De \`as unknown as\`-casts kunnen dan worden verwijderd.

## Impact
- Schema-wijzigingen worden direct als compile-fout zichtbaar
- Minder kans op runtime-fouten door verkeerde aannames over de datastructuur
- Betere onderhoudbaarheid en typeveiligheid

## Status
❌ **Open** – Nog niet geïmplementeerd

## Gerelateerd
- Zie GitHub issue: https://github.com/rob-erwt/recepten-app/issues/8`,
  },
  {
    title: '[T-04] Consolidatie migratiebestanden in schema.sql',
    priority: 3,
    label: 'Tech debt',
    description: `## Probleem
De database schema staat verspreid over meerdere bestanden:
- \`schema.sql\` (hoofdschema)
- \`migration_atomisch_recept.sql\` (T-02 RPC functie)
- \`migration_realtime_boodschappenlijst.sql\` (B-05 realtime)

Dit maakt het lastig om een verse database op te zetten.

## Oplossing
Consolideer alle migraties in \`schema.sql\` in de juiste volgorde:
1. Helper-functies (get_huishouden_id)
2. Tabellen
3. RLS policies
4. **Triggers & functies** (inclusief sla_recept_op uit migration_atomisch_recept.sql)
5. Seed data

## Impact
- Eén bestand voor complete database setup
- Makkelijker voor nieuwe developers
- Minder kans op gemiste migraties

## Status
⚠️ **Voorgesteld** – Nog niet uitgevoerd

## Gerelateerd
- Commit d9a2147: "Consolideer losse migratiebestanden naar één schema.sql" (deels)
- T-02 RPC functie moet nog toegevoegd worden aan schema.sql`,
  },
]

// ✅ Opgeloste issues (voor referentie, niet meer importeren in Linear)
const OPGELOSTE_ISSUES = [
  {
    title: '[T-01] Server-side filteren en pagineren in receptenoverzicht',
    priority: 2,
    status: 'Opgelost',
    commit: 'c722fac',
    description: 'Verplaatst filter- en pagineringslogica naar Supabase-queries. Dataverkeer daalt van alle N recepten naar max. 25 per verzoek.',
  },
  {
    title: '[T-02] Atomische opslag van recepten via database-transactie',
    priority: 2,
    status: 'Opgelost',
    commit: '0d68e07',
    description: 'RPC functie sla_recept_op voert alle operaties uit in één transactie. Elimineert risico op corrupte recepten.',
  },
]

async function gql(query, variables = {}) {
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: API_KEY },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors.map(e => e.message).join('\n'))
  return json.data
}

async function haalTeamsOp() {
  const data = await gql(`{ teams { nodes { id name } } }`)
  return data.teams.nodes
}

async function maakLabelAan(teamId, naam, kleur) {
  const data = await gql(
    `mutation($input: IssueLabelCreateInput!) {
      issueLabelCreate(input: $input) { issueLabel { id name } }
    }`,
    { input: { teamId, name: naam, color: kleur } }
  )
  return data.issueLabelCreate.issueLabel.id
}

async function haalOfMaakLabels(teamId) {
  const data = await gql(
    `query($teamId: ID!) {
      issueLabels(filter: { team: { id: { eq: $teamId } } }) {
        nodes { id name }
      }
    }`,
    { teamId }
  )
  const bestaande = data.issueLabels.nodes
  const labels = {}
  for (const [naam, kleur] of [['Tech debt', '#F59E0B']]) {
    const gevonden = bestaande.find(l => l.name === naam)
    labels[naam] = gevonden ? gevonden.id : await maakLabelAan(teamId, naam, kleur)
  }
  return labels
}

async function maakIssueAan(teamId, labelIds, issue) {
  const labelId = labelIds[issue.label]
  const data = await gql(
    `mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) { issue { id title url } }
    }`,
    {
      input: {
        teamId,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        labelIds: labelId ? [labelId] : [],
      },
    }
  )
  return data.issueCreate.issue
}

async function main() {
  console.log('\ud83d\udd17  Verbinding maken met Linear…')
  const teams = await haalTeamsOp()

  if (teams.length === 0) {
    console.error('\u274c  Geen teams gevonden.')
    process.exit(1)
  }

  let team
  if (GEWENST_TEAM) {
    team = teams.find(t => t.name.toLowerCase() === GEWENST_TEAM.toLowerCase())
    if (!team) { console.error(`\u274c  Team "${GEWENST_TEAM}" niet gevonden.`); process.exit(1) }
  } else if (teams.length === 1) {
    team = teams[0]
  } else {
    console.log('\ud83d\udccb  Meerdere teams gevonden. Kies via LINEAR_TEAM_NAME=<naam>:')
    teams.forEach(t => console.log(`   \u2022 ${t.name}`))
    process.exit(0)
  }

  console.log(`\u2705  Team: ${team.name}`)
  const labelIds = await haalOfMaakLabels(team.id)

  console.log(`\n\ud83d\udcdd  ${ISSUES.length} tech-debt issues aanmaken…\n`)

  let aangemaakt = 0
  for (const issue of ISSUES) {
    try {
      const result = await maakIssueAan(team.id, labelIds, issue)
      console.log(`  \u2713  ${result.title}`)
      console.log(`     ${result.url}`)
      aangemaakt++
    } catch (err) {
      console.error(`  \u2717  ${issue.title}: ${err.message}`)
    }
  }

  console.log(`\n\ud83c\udf89  Klaar! ${aangemaakt}/${ISSUES.length} issues aangemaakt.`)

  // Toon opgeloste issues voor referentie
  if (OPGELOSTE_ISSUES.length > 0) {
    console.log('\n\ud83d\udc93  Opgeloste issues (niet geïmporteerd):')
    OPGELOSTE_ISSUES.forEach(issue => {
      console.log(`  \u2705  ${issue.title} (${issue.commit})`)
    })
  }
}

main().catch(err => { console.error('Onverwachte fout:', err.message); process.exit(1) })
