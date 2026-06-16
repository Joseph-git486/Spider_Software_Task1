# 🌌 The Hawkins Labyrinth

A browser-based, turn-based strategy game built for the **Spider Web Development Induction**. Navigate a shifting 5×5 grid, roll dice to unlock blocks, dodge the Upside Down, and find the gate before Vecna grows too strong.

Built in **vanilla HTML, CSS, and JavaScript** — no frameworks, no build step.

---

## 🎮 Play

1. Download `hawkins-labyrinth.html`
2. Open it in any modern browser (Chrome, Firefox, Edge, Safari)

That's it. No server, no install.

**Live demo:** *(add GitHub Pages link here once deployed)*

---

## 🕹️ How to Play

Your goal is to find the hidden **🚪 Exit Door** and reach it with **more HP than Vecna**.

### Each turn
1. Click **Roll Dice** — get a number between 1 and 10
2. Click an adjacent cell (up / down / left / right)
3. If the cell is **locked**, your roll must be ≥ the cell's unlock requirement (shown on the cell)
4. If the cell is already **revealed**, you can walk into it freely (no roll needed)
5. A failed unlock attempt ends your turn — roll again

### Block types
| Icon | Block | Effect |
|------|-------|--------|
| ✨ | Real World | Safe |
| 🌿 | Upside Down | −15 HP |
| 👹 | Demogorgon | −25 HP (flamethrower kills it) |
| 🧠 | Mind Flayer | −35 HP (flamethrower kills it) |
| 🔥 | Flamethrower | Pick up — auto-uses on next enemy |
| 🌀 | Psychic | Pick up — makes next roll = 10 |
| 🚪 | Exit Door | Ends the game |

### Vecna
Starts at **5 HP**. The moment you make your first move, he gains **+1 HP every second**. The chime and pulse on his HUD are your timer. Move with purpose.

### Win / Lose
- **Win:** Reach the exit door with `Player HP > Vecna HP`
- **Lose:** Reach the exit with less HP than Vecna, or hit 0 HP at any point

---

## ⌨️ Controls

| Key | Action |
|-----|--------|
| `R` | Roll dice |
| `P` | Use psychic power |
| `U` | Undo last move |
| Click | Move to adjacent cell |

All actions are also available as on-screen buttons.

---

## ✅ Features

### Level 1 — Core Mechanics
- 5×5 dynamic grid with hidden blocks
- Adjacency-based movement with locked-cell unlock logic
- Digital 10-sided die (1–10)
- Randomized Exit Door placement every game
- Player health system (starts at 150 HP)
- Real World vs Upside Down identities with damage logic
- Vecna's real-time HP scaling (+1/sec from first move)
- Live HUD for both Player HP and Vecna HP
- Win/loss resolution based on HP comparison at exit

### Level 2 — Atmosphere & Mechanics
- Stranger Things-themed UI (Creepster + VT323 fonts, neon glow, corrupted Upside Down texture, pulsing gold exit door)
- Dice rolling animation with number flicker
- Screen shake + red flash on damage
- Ticking chime (Web Audio API) + visual pulse on Vecna's HUD every second
- **Power-up blocks:**
  - 🔥 Flamethrower — auto-fires on the next enemy you encounter
  - 🌀 Psychic — guarantees a 10 on your next roll
- **Enemy blocks:**
  - 👹 Demogorgon (−25 HP)
  - 🧠 Mind Flayer (−35 HP)

### Level 3 — Polish & Persistence
- **Undo** — full state snapshots, up to 30 moves back
- **Replay** — step-by-step text log of every action in the run
- **Leaderboard** — top 10 scores stored in `localStorage`, sorted by **dominance score** (Player HP − Vecna HP at win)

### Other
- Responsive layout (works on mobile and desktop)
- Live action log
- Help modal with all rules
- Restart button for fresh runs

---

## 🛠️ Tech Stack

- **HTML5** — single-file structure
- **CSS3** — flexbox + grid layout, custom properties, keyframe animations
- **Vanilla JavaScript** — no libraries, no frameworks
- **Web Audio API** — for the Vecna ticking chime
- **localStorage** — for the leaderboard

---

## 📁 File Structure

```
hawkins-labyrinth.html    # Entire game — HTML, CSS, JS in one file
README.md                 # This file
```

---

## 🧩 Code Organization

The script section is divided into clearly labeled blocks:

- **Constants & Types** — game configuration
- **State / Init** — grid generation and state setup
- **Rendering** — grid, HUD, preview, inventory
- **Game Logic** — dice, movement, effects
- **Vecna Timer + Chime** — real-time scaling
- **End Game** — win/loss modals
- **Leaderboard** — localStorage persistence
- **Undo / Replay** — history tracking
- **Help / Restart / Wiring** — UI hooks

---

## 🎨 Design Notes

- **Real World** cells use cyan/teal gradients to evoke the 80s neon aesthetic
- **Upside Down** cells use dark red gradients with radial spore patterns
- **Exit Door** glows gold with a pulsing animation to signal the goal
- **Enemy blocks** have a pulsing red shadow for tension
- The whole page uses a radial dark-red vignette background to set the mood

---
