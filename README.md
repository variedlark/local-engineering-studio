# 🚀 Local Engineering Studio (LES)

[![Rust](https://img.shields.io/badge/language-Rust-orange.svg)](https://www.rust-lang.org/)
[![Tauri](https://img.shields.io/badge/framework-Tauri_2.0-blue.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/frontend-React_18-61dafb.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**Local Engineering Studio** est la plateforme de conception de PCB et de microprocesseurs la plus avancée au monde, conçue pour les ingénieurs exigeants. Alliant la puissance de Rust, la flexibilité de Tauri et un rendu 3D GPU de pointe, LES redéfinit les standards de l'industrie électronique.

---

## ✨ Fonctionnalités Révolutionnaires

### 🧠 Intelligence de Conception
- **Auto-Routeur Titan** : Routage automatique multi-nets avec priorités intelligentes et gestion des paires différentielles.
- **Algorithme Push-and-Shove** : Routage interactif qui déplace dynamiquement les obstacles pour une densité maximale.
- **Moteur de Recommandation IA** : Analyse en temps réel de votre design avec suggestions d'optimisation.

### ⚡ Simulation & Physique de Précision
- **Solveur SPICE-lite & Sparse Matrix** : Simulation électrique nodale capable de gérer des millions de nœuds.
- **Analyse d'Intégrité du Signal (SI)** : Calcul d'impédance, de diaphonie (crosstalk) et de réflexions de signal.
- **Simulation Thermique** : Détection des points chauds (hotspots) et analyse de la dissipation de chaleur.
- **Simulation Logique** : Moteur de simulation numérique pour architectures de microprocesseurs (RISC-V).

### 🎨 Interface Studio 3D
- **Rendu GPU Accéléré** : Visualisation 3D interactive utilisant Three.js avec instanciation pour une fluidité absolue.
- **Système de Plugins** : Architecture extensible permettant d'ajouter des fonctionnalités personnalisées.
- **Versioning Distribué** : Synchronisation multi-utilisateurs basée sur les Vector Clocks pour une collaboration sans conflit.

### 🏭 Fabrication Industrielle
- **Export Gerber RS-274X** : Génération de fichiers de fabrication de haute précision.
- **Export STEP 3D** : Intégration mécanique parfaite avec l'exportation CAO 3D.
- **Générateur de BOM Intelligent** : Liste de composants automatisée avec détection des fabricants.

---

## 🏗️ Architecture Technique

Le projet est structuré en crates Rust modulaires pour une performance et une maintenabilité maximales :

| Crate | Description |
|-------|-------------|
| `domain-core` | Modèles de données, versioning distribué et validation. |
| `engine-routing` | Moteur A* 3D, paires différentielles et push-and-shove. |
| `engine-simulation` | Solveur nodal, modèles non-linéaires et thermique. |
| `engine-physics` | Analyse de l'intégrité du signal et impédance. |
| `engine-logic` | Simulation numérique et analyse de timing. |
| `engine-optimizer` | Système expert de recommandations de design. |
| `adapters-io` | Exportateurs Gerber, STEP, SVG et JSON. |
| `adapters-cloud` | Synchronisation temps réel et backups cloud. |

---

## 🚀 Démarrage Rapide

### Prérequis
- [Rust](https://www.rust-lang.org/tools/install) (dernière version stable)
- [Node.js](https://nodejs.org/) & [pnpm](https://pnpm.io/)
- Dépendances système (Linux) : `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

### Installation
```bash
# Cloner le dépôt
git clone https://github.com/variedlark/local-engineering-studio.git
cd local-engineering-studio

# Installer les dépendances
pnpm install

# Lancer en mode développement
pnpm tauri dev
```

---

## 🤝 Contribution

LES est un projet ambitieux. Nous accueillons les contributions de tous types :
- Correction de bugs
- Nouvelles fonctionnalités de simulation
- Amélioration de la bibliothèque de composants
- Documentation et tutoriels

---

## 📄 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Développé avec ❤️ par l'équipe Local Engineering Studio.**
