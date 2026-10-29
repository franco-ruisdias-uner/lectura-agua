import * as SecureStore from 'expo-secure-store';
enum auth{
  JWT_TOKEN = 'jwt-token'
}


export const setJwtToken = (token:string) =>{
  SecureStore.setItem(auth.JWT_TOKEN, token);
}

export const deleteJwtToken = async () =>{
  return SecureStore.deleteItemAsync(auth.JWT_TOKEN);
}

export const getJwtToken = async () =>{
  return SecureStore.getItemAsync(auth.JWT_TOKEN);
}