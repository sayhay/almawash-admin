# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Design System & Thème

Le thème vert unifié (Restyle + React Native Paper + MUI Data Grid) est centralisé dans `src/theme`.

### Vérifier l'intégration

1. Installez les dépendances si nécessaire :

   ```bash
   npm install
   ```

2. Démarrez l'application :

   ```bash
   npx expo start
   ```

3. Testez les écrans mobiles (Expo Go / simulateur) et web (`w` dans le terminal) pour valider :

   - la cohérence des couleurs (boutons, surfaces, fonds) en mode clair et sombre ;
   - le rendu des composants unifiés (`Surface`, `Section`, `StatCard`, `PrimaryButton`).

4. Sur le web, ouvrez les écrans **Utilisateurs** et **Réservations** et vérifiez que la MUI Data Grid applique bien la palette verte (header gras, hover, sélection) et que la barre d’actions (recherche, filtres, export) reste fonctionnelle.

5. Dans le dashboard/les stats, assurez-vous que les `StatCard` reflètent les données et que les cartes/charts sont bien intégrées dans les surfaces Restyle.

6. Exécutez le linter avant de pousser :

   ```bash
   npm run lint
   ```

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
