# Pixel Character Composer v2.6 Design Doc

## Goal
Solve animal homogenization. Move from "color-swapped round animals" to animals with distinct anatomy.

## Problem Statement
In v2.5, all animals share the same round head + round body + small features template. A fox looks like an orange bear; a rabbit looks like a white bear. This is the biggest blocker to commercial content.

## Strategy: Animal Anatomy Engine
Each animal is defined by an anatomy preset that specifies:
- Head shape (round, oval, pointed, flat)
- Ear shape (round, pointed, long, floppy, none, tufted)
- Snout shape (short, long, pointed, flat)
- Body shape (chubby, slim, pear, long)
- Tail shape (none, round, fluffy, long, small)
- Limb proportions (short arms, long arms, big feet, flippers, wings)
- Signature colors (base, light, dark, accent)

## Anatomy Presets

### Rabbit
- Head: round, slightly smaller
- Ears: long tapered (signature)
- Snout: short, split lip hint
- Body: pear-shaped, small
- Tail: small round cotton tail
- Feet: large hind feet
- Colors: white/pink

### Fox
- Head: triangular/pointed snout
- Ears: large pointed triangle
- Snout: long pointed
- Body: slim athletic
- Tail: large fluffy tail
- Colors: orange/cream/white

### Dog
- Head: rounded with variable snout
- Ears: floppy or pointed by breed
- Snout: medium
- Body: medium athletic
- Tail: small curved
- Colors: brown/white/tan

### Bear
- Head: large round
- Ears: small round on sides
- Snout: short broad
- Body: chubby teddy
- Tail: tiny
- Colors: brown/cream

### Cat
- Head: round with pointy cheeks
- Ears: large pointed triangle
- Snout: tiny
- Body: slim/slender
- Tail: long curved
- Colors: white/orange/black

### Panda
- Head: round with big cheeks
- Ears: round black
- Snout: broad flat white
- Body: chubby round
- Tail: tiny
- Colors: black/white

### Penguin
- Head: small round on top of oval body
- Beak: triangular orange
- Wings: flipper arms on sides
- Body: tall oval with white belly
- Feet: large orange webbed feet
- Colors: black/white/orange
- DO NOT use generic round template.

## Expression Engine v2
Map expressions to eye + mouth + cheek combinations:
- happy: sparkly eyes + open_smile + pink cheeks
- cute: big_round eyes + small_w + big cheeks
- sleepy: sleepy eyes + sleep mouth + no cheeks
- surprised: surprised eyes + surprised mouth + none
- sad: crying eyes + line mouth + none
- cool: tiny eyes + smirk + none
- love: heart eyes + small_w + shiny cheeks
- excited: sparkly eyes + open_smile + big cheeks

## Pose Physics v2
Add body physics per pose:
- sitting: body compact, legs folded under, head centered
- standing: body stretched, legs straight, arms at sides, slight hip shift
- waving: body tilted 5° toward raised arm, weight on one leg
- sleeping: body horizontal, head lying down, limbs tucked
- hugging: arms forward, body leaning slightly, head tilted
- holding: one arm raised with object, body tilted, head turned toward object
- eating: head tilted forward, arms holding food, cheeks puffed (optional)

## Material Style Presets
- kawaii: 3-5 colors, flat blocking, pastel accents
- premium: 6-8 colors, layered shading, detailed eyes
- mini: 2-4 colors, simplified silhouette, fewer details
- classic: 4-6 colors, medium detail, balanced shading

## Acceptance Criteria
- 40 golden samples across 7 animals
- Human animal recognition ≥ 95% (a fox must look like a fox, not a bear)
- Penguin must score ≥ 85
- Average Quality Score ≥ 90
- Each animal has at least one distinctive anatomy signature visible

## File Plan
- `composer_v2_6.py`: main implementation with anatomy engine
- `docs/pixel-character-composer-v2.6-design.md`: this doc
- Output: `/tmp/bead-character-v2_6/`
