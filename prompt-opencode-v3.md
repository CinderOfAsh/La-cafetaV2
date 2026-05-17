# PROMPT FOR OPENCODE — V3 CLEARPATH / WELLNESS

## OBJECTIVE
Transform the visual design of `~/UNIVA/La cafeta/versiones/V3` into the ClearPath wellness aesthetic. This must go beyond color changes — you MUST add decorative SVG elements, noise textures, animations, and custom cursors. Keep ALL functionality, logic, API calls, and data flow EXACTLY as they are.

## CRITICAL RULES
- **DO NOT** change ANY functionality — only classNames, CSS, and font imports
- The app must build and run without errors
- If a file already has SVG icons from lucide-react, KEEP them but style them with the new colors

## VISUAL ASSETS (already in the project)

The following files exist in `public/assets/` and can be referenced as `/assets/filename.svg`:

| File | Purpose |
|------|---------|
| `/assets/noise-texture.svg` | Subtle dot noise pattern overlay |
| `/assets/deco-blob-1.svg` | Organic blob shape (sage green, 8% opacity) |
| `/assets/deco-blob-2.svg` | Organic blob shape (sage green, 6% opacity) |

## COLOR PALETTE (exact hexes from reference)

```css
--sage: #7FA69B        /* Primary accent — buttons, highlights, decorative elements */
--sage-light: rgba(127, 166, 155, 0.08)  /* Subtle backgrounds */
--dark: #2E3231        /* Main text, headings */
--grey: #535956        /* Body text */
--light-grey: #949E9B  /* Meta text, labels */
--white: #FFFFFF       /* Page background */
```

## TYPOGRAPHY

```tsx
import { Inter, Crimson_Text } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const crimson = Crimson_Text({ weight: ['400', '600', '700'], subsets: ['latin'], variable: '--font-crimson' });
```

- Large headings: `var(--font-inter)`, weight 500, letter-spacing -0.03em
- Subheadings: `var(--font-crimson)`, serif, weight 400
- Body: `var(--font-inter)`, weight 400, 14px, line-height 1.8
- Prices/numbers: `var(--font-inter)`, weight 500, letter-spacing -0.04em, color var(--sage)
- Buttons: `var(--font-inter)`, weight 600

## DECORATIVE ELEMENTS YOU MUST ADD

### 1. Noise Texture Overlay
In the root layout.tsx, add this as the first child of `<body>`:
```tsx
<div className="fixed inset-0 pointer-events-none z-0" style={{ 
  backgroundImage: 'url(/assets/noise-texture.svg)',
  backgroundRepeat: 'repeat',
  backgroundSize: '100px 100px',
  opacity: 0.4,
  mixBlendMode: 'overlay'
}} />
```

### 2. Decorative Blob Shapes
Place decorative blob SVGs strategically on pages. Examples:
- Login page: blob-1 in bottom-right corner, rotated, z-index 0 behind content
- Hub pages: blob-2 in top-left corner behind cards
- POS page: subtle blobs behind the product grid

Use this pattern:
```tsx
<div className="fixed -bottom-20 -right-20 w-[300px] h-[200px] pointer-events-none z-0 opacity-[0.08]">
  <img src="/assets/deco-blob-1.svg" className="w-full h-full" />
</div>
```

### 3. Pill-Shaped Buttons (border-radius: 999px)
All buttons must be pills. Apply to ALL submit buttons, action buttons, hub cards.

### 4. Animated Hover Circles on Buttons
On primary buttons, add two pseudo-elements (circles) that animate on hover:
```css
.btn-sage {
  position: relative;
  overflow: hidden;
  background: #7FA69B;
  border-radius: 999px;
  color: white;
  font-family: var(--font-inter);
  font-weight: 600;
  padding: 12px 28px;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.btn-sage::before {
  content: '';
  position: absolute;
  width: 60px; height: 60px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.btn-sage:hover::before {
  transform: translate(-50%, -50%) scale(3);
}
```

### 5. Card Styling
```css
.card-wellness {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.02);
  transition: all 0.25s ease;
}
.card-wellness:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  transform: translateY(-2px);
}
```

### 6. Fade-Up Scroll Animations
Add Intersection Observer-based animations for sections. Use CSS only approach:
```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  filter: blur(4px);
  transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}
```

Include a small JS utility in layout.tsx or globals.css:
```tsx
// Add to layout.tsx body:
// useEffect(() => {
//   const observer = new IntersectionObserver((entries) => {
//     entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting));
//   });
//   document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
//   return () => observer.disconnect();
// }, []);
```

### 7. Custom Cursor
Add a subtle custom cursor effect. Not a full replacement, just a small follower dot:
```css
.cursor-follower {
  width: 8px; height: 8px;
  background: #7FA69B;
  border-radius: 50%;
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.3;
  transition: transform 0.1s ease;
  mix-blend-mode: multiply;
}
```

### 8. Input Fields
```css
input, select, textarea {
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 8px;
  padding: 10px 14px;
  font-family: var(--font-inter);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
input:focus {
  border-color: #7FA69B;
  box-shadow: 0 0 0 3px rgba(127, 166, 155, 0.08);
}
```

## FILES TO MODIFY

### 1. `src/app/globals.css` — REPLACE ENTIRELY
Include ALL the CSS classes, animations, and utility classes described above (noise overlay, btn-sage, card-wellness, reveal, cursor-follower, input styles, blob decorations, keyframes).

### 2. `src/app/layout.tsx` — MODIFY
- Replace fonts with Inter + Crimson_Text
- Add the Intersection Observer script in a useEffect
- Add the noise texture overlay div as first child of body
- Add the decorative blob SVGs (positioned fixed)
- Add the cursor follower element
- Keep ALL existing metadata, structure, and children

### 3. `src/app/login/page.tsx` — VISUAL ONLY
- White bg. Card: border-radius 16px, shadow. Button: pill-shape sage green.
- Add decorative blob in background.
- Keep ALL logic.

### 4. `src/app/hub-admin/page.tsx` — VISUAL ONLY
- Cards: border-radius 16px, shadow, hover translateY(-2px)
- Sage green accent for icons
- Blob decoration in background
- Keep ALL data and logic.

### 5. `src/app/hub-empleado/page.tsx` — VISUAL ONLY
- Same style. Keep ALL logic.

### 6-9. Admin/turno layouts + pages — VISUAL ONLY
- Same wellness aesthetic. Keep ALL logic.

## KEY ANIMATIONS SUMMARY
| Element | Animation |
|---------|-----------|
| Cards hover | translateY(-2px) + shadow increase, 0.25s ease |
| Buttons hover | Circle pseudo-element scales up from center |
| Page sections | Intersection Observer fade-up with blur |
| Cursor | Small sage dot following mouse |
| Noise overlay | Static texture, always visible |
| Decorative blobs | Static, z-index behind content |

## REFERENCE URL
https://clearpath-template.framer.website/

## TESTING
1. `npm run build` — must pass
2. `npm run dev -p 3003` — preview
3. Verify ALL pages render with new style
4. Verify ALL functionality still works (login, logout, product CRUD, comandas, etc.)
