import firebase from '@react-native-firebase/app';

export const getFirebaseApp = () => {
  if (!firebase.apps.length) {
    firebase.initializeApp();
  }
  return firebase.app();
};
