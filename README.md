# WTF Circles

Break down unknowns and bring clarity

WTF Circles is an interactive whiteboard tool and process designed to help you and your teams capture the things you’re truly clueless about—and then start a process of bringing clarity step by step. Whether you're planning a project, navigating personal relationships, or simply sorting through ideas, this tool gives you a visual method to move from confusion to understanding.

---

## Problem Statement

We all have areas in life where we’re uncertain, overwhelmed, or simply clueless about what’s important. Traditional organization tools often force a linear approach, which can stifle creativity and ignore the messy process of gaining insight. WTF Circles solves this by letting you capture raw, unclear ideas and then, through actionable steps, gradually refine them into clear, confident thoughts. It’s a system that works not just for work or creativity but for any aspect of life—from planning projects to resolving personal dilemmas.

---

## How It Works

WTF Circles features three concentric circles that represent different levels of clarity:

- **Outer Circle (WWTF):**  
  This is where your raw, unrefined ideas live—those things you’re completely clueless about. They start off with a cool blue background and a question mark icon.

- **Middle Circle (WTF):**  
  As you add next actionable steps to a sticky note, it moves here. This zone represents ideas that are in the process of becoming clear. The note’s style updates (e.g., turns orange with a “WTF” label) to reflect progress.

- **Inner Circle (Clarity):**  
  When a sticky note has accumulated enough actionable steps and clarity, you move it to the inner circle. Here, it appears in green with a checkmark, symbolizing that the idea is clear and ready to be acted on.

### Next Actions Panel

- **Interactive Next Steps:**  
  Click on any sticky note to reveal a next actions panel where you can add specific, actionable steps to help clarify the idea.
- **Step-by-Step Clarity:**  
  As you add and eventually complete these next actions, you can drag the note inward—from WWTF to WTF, and finally to Clarity.

---

## Scenario Walkthrough

Imagine you’re facing a challenging decision about your career, a new project, or even a personal relationship. Here’s how WTF Circles guides you:

1. **Capture the Uncertainty:**  
   Start by jotting down your vague thoughts as sticky notes in the outer circle (WWTF). For instance, “Am I making the right choice about my career?”

2. **Add Actionable Steps:**  
   Click on the note to open the next actions panel and list steps such as:
   - List pros and cons.
   - Research industry trends.
   - Talk to a mentor.
   
   With these steps added, the note shifts to the middle circle (WTF) with a warm orange tone and a “WTF” label.

3. **Achieve Clarity:**  
   Once enough actions have been defined and checked off, the note moves into the inner circle (Clarity), transforming to green with a checkmark—signaling that you’ve moved from cluelessness to clear, actionable insight.

---

## Current Features

- **Three Concentric Circles:**  
  Visually distinguish between raw uncertainty, partial clarity, and complete understanding.
- **Sticky Notes:**  
  Capture any thought or idea that you feel clueless about.
- **Next Actions Panel:**  
  Click on a sticky note to add specific steps that help bring clarity.
- **Visual Feedback:**  
  As sticky notes are dragged inward, they change colour and icons (blue with a question mark → orange “WTF” → green with a checkmark).
- **Local Storage:**  
  The app currently uses local storage to save your session data.

---

## Future Plans

- **Persistent Storage:**  
  Implement a back-end system for permanent data storage.
- **Team Collaboration:**  
  Allow users to share and collaboratively work on WTF Circles in real-time.
- **Enhanced UX/UI:**  
  Refine the interface for a more intuitive and visually appealing experience.
- **Markdown Export:**  
  Enable exporting of sticky note summaries and next actions as Markdown files.

---

## Getting Started

### Prerequisites

- Modern web browser
- Node.js and npm (for local development)

### Installation

1. **Clone the repository:**

   ```
   git clone https://github.com/yourusername/wtf-circles.git
   cd wtf-circles
   ```

2. **Install dependencies:**

   ```
   npm install
   ```

3. **Run the application:**

   ```
   npm start
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Contributing

Contributions are welcome! If you have suggestions, bug fixes, or new features, please open an issue or submit a pull request. Follow our coding guidelines and include tests where possible.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

For questions, suggestions, or collaboration opportunities, please reach out at [calendly.com/.](https://calendly.com/colmbyrne)

---

WTF Circles empowers you to embrace your uncertainty and turn it into actionable clarity. Whether for work, relationships, or any area of life, capture what you’re clueless about and watch as it transforms into clear, focused insight—one sticky note at a time.
 HEAD
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
 


