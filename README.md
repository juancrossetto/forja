# Método R3SET - Fitness App

App de fitness integral con 3 pilares: Entrenamiento, Nutrición y Psicología.
Construida con React Native + Expo + TypeScript.

## Setup

```bash
cd MetodoR3SET
npm install
```

### Fuentes
Descargá las fuentes de Google Fonts y colocalas en `assets/fonts/`:
- **Space Grotesk**: Regular, Medium, Bold
- **Manrope**: Regular, Medium, SemiBold, Bold
- **Lexend**: Regular, Medium, SemiBold

### Correr la app

```bash
# Desarrollo
npx expo start

# Development build (recomendado - soporta módulos nativos)
npx expo start --dev-client

# Simulador específico
npx expo start --ios
npx expo start --android
```

## Estructura del proyecto

```
src/
├── components/common/    # Componentes reutilizables (Button, Card, Input, etc.)
├── navigation/           # React Navigation (Stacks + Bottom Tabs)
├── screens/
│   ├── auth/             # Login, SignUp
│   ├── home/             # Inicio, Metas, AddMenuOverlay
│   ├── training/         # Entrenamientos, Detalle, En Vivo, Resumen
│   ├── nutrition/        # Comidas
│   ├── progress/         # Progreso estadístico
│   ├── photos/           # Cargar fotos de progreso
│   ├── measurements/     # Peso y medidas con avatar
│   └── profile/          # Perfil de usuario
├── store/                # Zustand stores (auth, training, nutrition, progress, goals)
├── theme/                # Design system (colores, tipografía, spacing)
└── types/                # TypeScript types
```

## Design System: "The Kinetic Monolith"

- **Background**: #0e0e0e (Total Black)
- **Primary**: #D1FF26 (High-Voltage Lime)
- **Secondary**: #00e3fd (Cyan)
- **Tertiary**: #ff734a (Orange)
- **Fonts**: Space Grotesk / Manrope / Lexend

## Navegación

```
Root Navigator
├── Auth Stack (Login, SignUp)
└── Main Tabs (5 tabs)
    ├── Home Stack (Inicio → Metas, Perfil)
    ├── Training Stack (Lista → Detalle → En Vivo → Resumen)
    ├── FAB Center (AddMenuOverlay modal)
    ├── Nutrition Stack (Comidas)
    └── Progress Stack (Progreso → Fotos, Medidas)
```

## Stack tecnológico

- **Expo** ~52 con development builds
- **TypeScript** strict mode
- **React Navigation** v7 (native-stack + bottom-tabs)
- **Zustand** v5 para state management
- **expo-blur, expo-linear-gradient** para glassmorphism
- **react-native-reanimated** para animaciones
