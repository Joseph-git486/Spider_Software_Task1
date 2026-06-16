# ♦ King of Diamonds

> *"You are trapped in a psychological numbers game. To survive, you don't just need to know the rules — you must anticipate the collective behavior of your enemies."*

A browser-based implementation of the **Keynesian Beauty Contest** — a game theory classic where winning isn't about picking the best number, but predicting what everyone else will pick.

---

## How to Play

Open `king-of-diamonds.html` in any browser. No installation, no dependencies.

Each round, you and 3 bots simultaneously choose a number between **0 and 100**.

1. The system averages all active players' numbers.
2. That average is multiplied by **0.8** to get the **Spider Number**.
3. The player whose number is **closest to the Spider Number** wins the round.
4. Every other player loses **1 life**. The winner keeps theirs.

The game continues until you're eliminated or the last bot falls.

---

## Game Rules

| Rule | Detail |
|------|--------|
| Players | 1 Human + 3 Bots |
| Number range | 0 – 100 (whole numbers only) |
| Spider Number | `Average of active players × 0.8` |
| Lives | 5 per player |
| Round loser penalty | −1 life |
| Elimination | Reach 0 lives → removed from all future rounds |
| Average recalculation | Only active (non-eliminated) players count |
| Victory | All 3 bots eliminated |
| Game Over | You reach 0 lives |

---

## Features

- **Live hearts display** — see every player's remaining lives at a glance
- **Round-by-round breakdown** — each player's chosen number and their distance (Δ) from the Spider Number
- **Elimination system** — dead bots are excluded from future averages, changing the math each round
- **Restart** — play again instantly without refreshing

---

## Tech Stack

Pure vanilla web — no frameworks, no build tools, no dependencies.

- HTML5
- CSS3
- JavaScript (ES6+)

---

## Project Structure

```
king-of-diamonds.html   ← entire game in one file
README.md
```

---