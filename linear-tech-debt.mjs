#!/usr/bin/env node
/**
 * ReceptenApp – technische verbeterpunten importeren in Linear
 *
 * Gebruik:
 *   export LINEAR_API_KEY=lin_api_xxxxxxxxxxxx
 *   node linear-tech-debt.mjs
 */

const API_KEY = process.env.LINEAR_API_KEY
const GEWENST_TEAM = process.env.LINEAR_TEAM_NAME ?? null

if (!API_KEY) {
  console.error('❌  Geen API-key gevonden. Zet eerst:\n   export LINEAR_API_KEY=lin_api_xxxxxxxxxxxx')
  process.exit(1)
}

const ISSUES = [
  {
    title: '[T-01] Server-side filteren en pagineren in receptenoverzicht',
    priority: 2,
    label: 'Tech debt',
    description: `## Probleem
\`ReceptenLijst\` laadt momenteel alle recepten in één keer op in de browser. Filteren op naam en categorie, en de paginering, worden volledig client-side uitgevoerd. Bij 250+ recepten is dit merkbaar traag en schaalt het slecht.

## Oplossing
Verplaats filter- en pagineringslogica naar Supabase-queries:
- \`.ilike('naam', '%term%')\` voor naamzoeken
- \`.in('id', matchingIds)\` na categoriefilter via \`recept_categorieen\`
- \`.range(from, to)\` voor paginering
- \`{ count: 'exact' }\` voor het totaalaantal resultaten
- Debounce (300 ms) op het zoekveld om DB-calls te beperken

## Impact
Dataverkeer daalt van alle N recepten naar max. 25 per verzoek. Schaalt lineair mee met de grootte van de receptenlijst.`,
  },
  {
    title: '[T-02] Atomische opslag van recepten via database-transactie',
    priority: 2,
    label: 'Tech debt',
    description: `## Probleem
Bij het opslaan van een bewerkt recept worden ingrediënten, stappen en categorieën eerst volledig verwijderd en daarna opnieuw ingevoegd als drie losse database-operaties zonder transactie. Bij een fout na de deletes blijft het recept zonder inhoud achter.

\`\`\`ts
// ReceptFormulier.tsx — niet atomisch
await supabase.from('ingredienten').delete().eq('recept_id', receptId)
await supabase.from('stappen').delete().eq('recept_id', receptId)
await supabase.from('recept_categorieen').delete().eq('recept_id', receptId)
// ... dan inserts — bij fout zijn de deletes al doorgevoerd
\`\`\`

## Oplossing
Wikkel de mutatielogica in een PostgreSQL-functie (Supabase RPC) die alles in één transactie uitvoert. Alternatief: vervang delete+insert door een upsert-strategie die bestaande rijen bijwerkt zonder te verwijderen.

## Impact
Elimineert het risico op corrupte recepten (lege ingrediëntenlijst) bij netwerk- of serverfouten.`,
  },
  {
    title: '[T-03] Type-veilige Supabase-queries via CLI-codegeneratie',
    priority: 3,
    label: 'Tech debt',
    description: `## Probleem
Op meerdere plekken wordt TypeScript bewust omzeild voor geneste Supabase-joins:

\`\`\`ts
// Voorbeelden van unsafe casts
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
Schema-wijzigingen worden direct als compile-fout zichtbaar. Minder kans op runtime-fouten door verkeerde aannames over de datastructuur.`,
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
  console.log('🔗  Verbinding maken met Linear…')
  const teams = await haalTeamsOp()

  if (teams.length === 0) {
    console.error('❌  Geen teams gevonden.')
    process.exit(1)
  }

  let team
  if (GEWENST_TEAM) {
    team = teams.find(t => t.name.toLowerCase() === GEWENST_TEAM.toLowerCase())
    if (!team) { console.error(`❌  Team "${GEWENST_TEAM}" niet gevonden.`); process.exit(1) }
  } else if (teams.length === 1) {
    team = teams[0]
  } else {
    console.log('📋  Meerdere teams gevonden. Kies via LINEAR_TEAM_NAME=<naam>:')
    teams.forEach(t => console.log(`   • ${t.name}`))
    process.exit(0)
  }

  console.log(`✅  Team: ${team.name}`)
  const labelIds = await haalOfMaakLabels(team.id)

  console.log(`\n📝  ${ISSUES.length} tech-debt issues aanmaken…\n`)

  let aangemaakt = 0
  for (const issue of ISSUES) {
    try {
      const result = await maakIssueAan(team.id, labelIds, issue)
      console.log(`  ✓  ${result.title}`)
      console.log(`     ${result.url}`)
      aangemaakt++
    } catch (err) {
      console.error(`  ✗  ${issue.title}: ${err.message}`)
    }
  }

  console.log(`\n🎉  Klaar! ${aangemaakt}/${ISSUES.length} issues aangemaakt.`)
}

main().catch(err => { console.error('Onverwachte fout:', err.message); process.exit(1) })
