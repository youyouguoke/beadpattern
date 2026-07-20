# Pixel Character Composer v2.5 Design Doc

## Goal
Move from kawaii icon generator to Etsy-level bead character design system.

## Key Principles
- Head 45-55%, body 45-55% of visual weight (not 65/35)
- Natural curves, not geometric blocks
- Layered body colors (4 tones: dark / base / light / highlight)
- Eyes are the most important feature: 8x8 detail with highlight + shadow
- Pose adds life: rotation, tilt, asymmetric arms
- Accessories (carrot, etc.) must not dominate the face

## Architecture

### 1. CharacterSkeleton v2.5
```python
class CharacterSkeleton:
    animal: str
    pose: str          # sitting, standing, hugging, holding, sleeping, waving
    body_shape: str     # round, slim, baby, teddy, panda, cub
    body_rotation: int  # -10..10 degrees (integer, applied as x shift per y)
    head_tilt: int      # -5..5
    arm_position: str   # front, side, up, folded, none
    leg_position: str   # folded, straight, crossed, none
```

### 2. Pose Engine v2
Each pose defines a skeleton template with rotation/tilt/limb offsets.
- `sitting`: body lower, legs folded, head centered
- `standing`: body tall, legs straight, arms at side
- `hugging`: arms forward, body rotated 5°, head tilted -3°
- `holding`: one arm raised, accessory in hand, body rotated 8°
- `sleeping`: head tilted 90°, eyes shut, body curled
- `waving`: one arm up, body tilted 5°

### 3. Feature Library v2

#### Eyes (10 variants)
| id | description | size | detail |
|----|-------------|------|--------|
| big_round | large round black eye with white highlight | 8x8 | yes |
| sparkly | big_round + star highlight | 8x8 | yes |
| sleepy | half-closed curve | 6x4 | soft |
| wink | one eye closed, one open | 6x6 + 6x4 | yes |
| tiny | small dot | 4x4 | simple |
| shy | eyes looking down-left | 6x6 | yes |
| star | star-shaped pupils | 6x6 | yes |
| heart | heart-shaped pupils | 6x6 | yes |
| closed_smile | ^ ^ | 5x3 | simple |
| crying | tears below eyes | 6x8 | yes |

#### Mouths (10 variants)
| id | description |
|----|-------------|
| small_w | small w-shape |
| open_smile | open mouth with tongue |
| tongue | tongue out |
| smirk | sideways smile |
| sleep | small drool |
| laugh | laughing mouth open |
| tiny | tiny dot |
| cat | cat mouth :3 |
| surprised | small O |
| line | straight line |

#### Cheeks (5 variants)
| id | description |
|----|-------------|
| pink | standard blush |
| big | larger blush |
| freckles | dot pattern |
| none | clean |
| shiny | highlight + blush |

### 4. Body Shape Library
Each animal has 2-3 body shapes:
- Rabbit: round, slim, baby
- Bear: teddy, panda, cub
- Cat: chibi, slim, baby
- Dog: puppy, slim, chubby
- Fox: slim, baby, fluffy
- Penguin: chubby, slim, baby
- Panda: standard, chubby, baby

### 5. Color / Material Engine
Each body part gets 4-tone palette:
- outline: dark shadow (K or S)
- base: main color
- light: lighter belly/face patch
- highlight: bead shine (Z or W dots)

Material Preview:
- Each bead gets circular highlight + soft shadow
- Beads slightly separated (grid visible)
- Dark background to pop colors
- Optional: slight plastic sheen

### 6. Composition Rules
- Face is the focal point: center upper 50%
- Accessory size ≤ 25% of body width
- Accessory saturation lower than face
- Eyes use 4-level detail
- Ears have natural tapering curve
- Body has belly patch (light) to create depth
- Feet/paws at bottom anchor the character

## Acceptance Criteria
- 20 golden samples
- Head/body ratio 45-55 / 45-55
- Eye library at least 10 variants, all with highlight
- 5 poses working
- Human visual review target 8/10
- Minimum QualityValidator v2 score ≥ 80

## File Plan
- `composer_v2_5.py`: main implementation
- `pose_engine.py`: pose skeletons
- `feature_library.py`: eye/mouth/cheek stamps
- `body_shapes.py`: per-animal body shape definitions
- `material_preview.py`: finished render with bead material
- `golden_v2_5.py`: golden sample runner
