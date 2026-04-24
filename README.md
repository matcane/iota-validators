# Iota Validators

## Wymagania

- [Node.js](https://nodejs.org/) (24+ LTS)
- [Yarn](https://yarnpkg.com/) w katalogu głównym repozytorium
- [Npm](https://npmjs.org/) w katalogu workera

## Uruchomienie lokalnie

### 1. Worker (API proxy)

```bash
cd worker
npm install
npm run dev
```

### 2. Zmienne środowiskowe aplikacji

```bash
EXPO_PUBLIC_WORKER_URL=http://localhost:8787
EXPO_PUBLIC_WORKER_URL=http://localhost:8787 // dla androida
```

### 3. Aplikacja Expo

```bash
yarn prebuild
yarn android
yarn ios
```

### 4. Demo
https://github.com/user-attachments/assets/f34434d8-2a5f-4f89-b8eb-da10902a8e45
 

