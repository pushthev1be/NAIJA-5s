# Naija 5s — Super League

demo link:https://naija-5s.onrender.com





A fast-paced, arcade-style 5v5 soccer simulation built in pure HTML5 and JavaScript! **Naija 5s** brings high-energy gameplay, dynamic mechanics, and thrilling special abilities right to your browser. 

## Features
- **Dynamic 5v5 Action**: Command your squad through lightning-fast matches. 
- **AI & Tactics**: CPU players adjust tactics, maintain formations, make proactive passes under pressure, and even use exclusive skills against you.
- **Skill System**: Players possess varying Star Levels (1 to 3 stars). High-tier players can utilize advanced skills like the **Power Shot**, **Speed Boost**, and **Long Shot**.
- **The Fireball Ultimate 🔥**: 3-star players with the Power Shot skill can overcharge their kick meter to unleash an unstoppable Fireball that travels at blazing speeds and literally phases through the goalkeeper!
- **Hat Trick Mode**: Score 3 goals with a single player to trigger "Hat Trick Mode," maximizing all of their stats for the remainder of the match and giving them flaming footprints.
- **Advanced Goalkeeping**: Keepers stay disciplined on the line, cut off angles, and feature a "Super Catch" mechanic to snatch fast shots right out of the air.
- **Game Modes**: Play Solo vs CPU, challenge a friend in 2-Player Local PvP, or conquer the League Mode.
- **Full Gamepad Support**: Enjoy a console-like experience with full controller support (PlayStation layout natively displayed on menus).

## How to Play

### Controls (Keyboard / Gamepad)
- **Move**: `WASD` / Arrow Keys / `Left Stick`
- **Sprint**: Hold `Shift` / Hold `L2` or `R2`
- **Pass**: `E` / `Square (□)`
- **Shoot (Charge)**: Hold `Space` / Hold `Cross (×)`
- **Aim Shot**: Hold `Space` + Arrow Keys / Hold `Cross (×)` + `Right Stick`
- **Tackle (Slide)**: `C` / `Circle (○)`
- **Switch Player**: `Tab` / `Triangle (△)`
- **Pause/Resume**: `ESC` / `Options`

### Pro Tips
- Watch the stamina ring around your active player when sprinting!
- Tapping the shoot button lightly produces a quick ground tap, but holding it charges a powerful lifting shot.
- Pay attention to weather conditions! Rain makes the pitch slippery and balls bounce less, while wind will affect the trajectory of lobbed passes and shots.

## Getting Started

1. Clone this repository.
2. The game uses modern ES modules (`game.config.js` and `dev-panel.js` imported into `index.html`), so you must run it via a local development server to bypass CORS restrictions.
3. If you have Node.js installed, you can use:
   ```bash
   npx serve .
   # OR
   npm run dev
   ```
4. Open the provided localhost URL in your browser and enjoy the match!

## Technology
Built entirely from scratch with Vanilla HTML5 Canvas and JavaScript. No external rendering engines or physics libraries were used!
