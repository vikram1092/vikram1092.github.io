# Bastrop37 — Story bible

Revision: 2026-09-27. Status: Phase 1 approved by the user on 2026-09-27; not a claim that the game implements this story.

## Read this first

This file is the source of truth for story and creative constraints. Three responsibility-led handoffs expand it:

1. [Phase 1 — Narrative and encounter direction](docs/bastrop37/PHASE_1_NARRATIVE_AND_ENCOUNTERS.md): story beats, dialogue, playable objectives, transitions, and narrative review.
2. [Phase 2 — Art and HUD production](docs/bastrop37/PHASE_2_ART_AND_HUD.md): asset inventory, chapter environments, character presentation, UI behavior, and visual review.
3. [Phase 3 — Implementation and validation](docs/bastrop37/PHASE_3_IMPLEMENTATION_AND_VALIDATION.md): system contracts, engineering milestones, saves, tests, and acceptance gates.

Phase 1 defines what happens; Phase 2 defines how it reads; Phase 3 integrates and verifies it. Engineering should consult early on feasibility. Complete one small playable slice before producing the entire campaign. These documents are for review, not instructions to immediately build everything.

The older `BASTROP37_PLAN.md` documents the original prototype. Its sea-wall objective, countdown structure, villain introduction, and audio expansion are superseded. Its previous commit/push workflow does not itself authorize publishing this revision.

## Confirmed direction

- Bastrop is an **inland city**. Storm infrastructure means reservoirs, river floodgates, spillways, and drainage systems. No coast, sea wall, or ocean extraction.
- Jo is a teenage street kid with a motorcycle. Mayor Vlad asked Jo to pick up a module and bring it to him. **The story starts after the pickup.** The pickup location is unimportant and needs no scene.
- Vlad is the mayor. No family or friendship backstory is required. He appears helpful in Level 1 and betrays Jo in Level 2.
- Omega is the AI associated with the module. Vlad is causing the city's problems and withholding the AI that could help people solve them.
- Only **Jo, Vlad, and Omega** speak. No named allies, support team, dispatcher, or secondary villains.
- Jo becomes a fugitive but is the good guy. Survival and the greater cause drive the story. Release Omega to the public at the end.
- Multiple levels, environments, and gameplay vehicles; a simple, linear story.
- Keep third-person chase gameplay and the current sprite-based/faked-depth approach. No required 3D migration. Layering and optional shaders may improve the retro feel.
- High-definition presentation with lo-fi grit; spectacular aggression; desktop first while preserving mobile play.
- Dialogue happens while riding. Clear traffic for important exchanges and author level endings deliberately.
- Small character asset scope: existing rider refined as Jo, one Vlad portrait, one Omega symbol.
- No new audio work. Existing sound is a compatibility concern, not a storytelling dependency.

## Details approved with Phase 1

These details were approved with the complete Phase 1 specification on 2026-09-27. They fill gaps without adding subplots:

- Jo accepts a paid delivery. Vlad says the module will help repair city infrastructure; Jo has no reason to suspect the job initially.
- The module contains a sealed, portable instance of Omega. Its local interface speaks through Jo's bike and inspects compatible nearby equipment. Public distribution requires physical municipal access points.
- Vlad uses a discreet courier to recover the module without a public transfer. Do not explain who removed it or invent a secret prior relationship with Jo.
- In Level 2, municipal recovery equipment attempts to erase the module and detain Jo. The carrier scan exposes its wipe/detention orders and stored power-shutdown authorization; Omega reads that evidence and Vlad admits ordering the shutdowns. His response confirms deliberate interference.
- An old public relay (two nearby relay points) and a civic access point are the two stages required for release. Level 3 lights only local readiness indicators; it does not repair public systems or release Omega. Keep network jargon out of dialogue.
- Level 4 uses one anonymous bus and a barrier on a shared uphill escape corridor. A local spillway record exposes Vlad's order to discharge toward the lower road. Jo opens the barrier, protects the bus, and reaches the civic ramp. This deliberate civilian endangerment was approved with Phase 1.
- Five short levels. Duration and wording are tunable; the betrayal and final release positions are fixed.

## Premise

Jo is already riding when the game begins. The module is secured to the bike. Mayor Vlad calls with delivery instructions and reassurance: bringing it in will help get Bastrop working again.

Blackouts and failing signals complicate the trip. A voice from the module identifies itself as Omega and helps Jo through a damaged stretch of road. Vlad explains that it is a municipal diagnostic system. For now, his explanation seems reasonable.

At the delivery approach, municipal machines lock onto the module. The carrier scan exposes its own order records for Jo and Omega to read. Their instructions are to wipe it and detain its carrier. Omega identifies deliberate shutdown orders bearing Vlad's authorization. Jo confronts the mayor. Vlad tells Jo to stop asking questions and hand it over.

Jo refuses. The delivery becomes an escape.

Omega can help Bastrop diagnose and repair its failures, but Vlad needs those failures to keep people dependent on him. Jo carries it toward the public network, enduring pursuit and diverting to prevent a storm-control disaster. At the civic network, Jo completes a moving connection that distributes Omega beyond Vlad's control.

The release commits on a cleared road and cannot be undone by an epilogue crash. After a brief dawn transition, the game ends with a quieter ride through the first signs of recovery. Omega makes help available; people and infrastructure still need time to recover. No instant utopia or sequel twist is needed.

## The three characters

### Jo

A teenage street kid, resourceful and familiar with riding through Bastrop. Do not invent an exact age, gender, family tragedy, workshop ownership, or formal mechanic occupation without a story need. Use Jo or they/them in production notes.

Jo starts with a practical job and a credible promise of helping the city. Their decency appears through choices: refusing to destroy Omega, clearing a threatened civilian vehicle's route, and completing the release when escape alone would be easier.

Voice: brief, observant, skeptical once given reason. Nervousness and humor are welcome; constant quips are not. Jo knows streets and machines better than municipal politics.

Gameplay presence: the existing rider/bike and text replies labeled JO. No portrait or off-bike scenes required.

### Omega

A contained AI that can help solve practical problems. The local instance communicates, diagnoses nearby systems, and assists where Jo establishes access. It cannot reach every machine remotely or free itself merely by deciding to do so.

Omega is neither omniscient nor secretly evil. It reports evidence clearly, admits limits, and needs Jo's judgment and movement. Trust grows from useful help and corroborated facts.

Voice: calm, concise, concrete. Avoid technical lectures. Gameplay presence: one animated HUD symbol and text. The same identity persists after release.

### Mayor Vlad

Initially a reassuring authority giving a street kid a straightforward job. No sinister portrait change, villain title, or threatening opening transmission should spoil Level 1.

Vlad authorizes failures and limits access to Omega to retain control. At the betrayal, friendliness becomes conditional: obey and be treated well; refuse and be called dangerous. Later he blames Jo for the city's instability.

Voice: controlled, plain, paternalistic when convenient. No deeper conspirator or repeated villain monologues. Gameplay presence: one portrait, reused on public screens where useful. Words and actions establish his change.

## The five levels

| Level | Start objective | Turn through gameplay | End condition |
|---|---|---|---|
| 1 — Delivery | Bring the module to Vlad | Omega helps Jo through failing infrastructure; Vlad remains apparently helpful | Reach delivery approach, finish clear-road exchange, save |
| 2 — Betrayal | Enter inspection route | Wipe/detention order and Vlad's response expose the trap; Jo refuses | Escape recovery pursuit, choose public release, save |
| 3 — Public Access | Reach old public relay | Connect physical relay points while pursuit tries to interrupt | Distribution route prepared; Omega still contained; save |
| 4 — Lockdown | Reach civic district | Vlad manipulates storm infrastructure; Jo clears a civilian escape route | Civilian vehicle reaches safety and civic road opens; save |
| 5 — Release | Connect Omega to civic network | Maintain moving connection through final opposition | Omega distributed, recovery ride completed, campaign completion saved |

Full beats and dialogue are in Phase 1. No earlier level can set Omega's release flag.

## Story through driving

Use **action → traffic clears → conversation → changed objective → action**. A level is not a constant combat wave with dialogue placed over it.

During story stretches, stop traffic spawning and let vehicles leave beyond the camera. Pursuers visibly disengage or are defeated before a long exchange. Never make threatening vehicles vanish in front of the player.

Keep Jo riding through an open stretch while the player reads. Safe road can loop until the exchange is advanced; narrative progression must not require reading at a particular speed. Keep critical upcoming landmarks out of view until the route advances again.

Level endings are playable resolutions followed by traffic clearing, a short exchange, a saved transition, and an explicit continue action. No new mandatory cinematic system. Brief fades or title overlays can preserve flow.

## Stakes, presentation, and scope boundaries

- Reward aggression against hostile machines and marked control equipment, not civilian destruction.
- Show failures and repairs: dead signals, blocked drainage, restored relay lights, and route changes.
- Populate the city through buildings, signs, traffic, and anonymous vehicles rather than a supporting cast.
- Environments are layered art, road strips, and projected props. Asset depth does not imply a 3D engine.
- Bike-associated futuristic HUD; camera remains third person.
- No open world, morality branches, skill tree, inventory, weapon collection, on-foot play, dialogue choices, voice acting, or mandatory shader rewrite.
- Overdrive, escort, and connection mechanics serve authored encounters; add them only at defined milestones.

## Superseded ideas — do not reintroduce

- Workshop raid, discarded-terminal discovery, clinic restoration opening, or playing the module pickup.
- Vlad as a relative or family friend; Director Voss as villain.
- Named allies building a network or speaking from escort vehicles.
- Releasing Omega in Level 3, rescuing a separate AI from a remote prison, or an evil-Omega twist.
- Sea-wall escape, universal ninety-second timer, first-person helmet view, 3D migration, expanded audio production.

## Review priorities

Review delivery-to-betrayal logic first, then traffic/dialogue rhythm and level endings. Review one art treatment before commissioning whole chapter kits. Build one short Delivery slice before expanding. Dialogue and tuning can change without changing the core constraints.

## Why these decisions matter

| Decision | Reason to preserve it |
|---|---|
| Authored driving chapters replace a single timed run | The concept needs purpose and escalation through situations, not only denser traffic or higher speed. |
| Start after pickup | The pickup adds exposition and assets without strengthening the central delivery, betrayal, and release arc. |
| Vlad begins as a helpful mayor | Jo needs a credible reason to accept the job; the betrayal should change both the objective and the relationship. |
| Only three speakers | Concentrates attention on Jo's trust in Vlad and growing trust in Omega; avoids supporting-cast production and subplot sprawl. |
| Preserve the sprite-based third-person experience | The user wants richer depth and grit close to the existing game, without the cost and uncertainty of a 3D migration. |
| Minimal character art | Portraits and HUD identity serve actual gameplay needs; full character rigs and expression libraries do not yet earn their cost. |
| Clear-road dialogue | Multiple elements can coexist across a level without making the player read important plot while dodging attacks. |
| Final release is playable | The greater cause becomes the result of the player's driving, rather than something completed offscreen. |
| Small first slice and deferred audio | Proves the new rhythm and presentation before multiplying assets, mechanics, and production responsibilities. |

These reasons explain the current direction; they are not invitations to reinstate earlier alternatives without discussion.
