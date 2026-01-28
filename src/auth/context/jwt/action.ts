import axios, { endpoints } from 'src/utils/axios';

import { setSession } from './utils';
import { STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export type SignInParams = {
  user_name: string;
  password: string;
};

export type SignUpParams = {
  user_name: string;
  password: string;
  firstName: string;
  lastName: string;
};

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ user_name, password }: SignInParams): Promise<void> => {
  try {
    const params = { user_name, password };

    const res = await axios.post(endpoints.auth.signIn, params);

    const { tokenData } = res.data;

    console.log("tokenData: ",tokenData);

    if (!tokenData) {
      throw new Error('Access token not found in response');
    }

    setSession(tokenData.token);
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({
  user_name,
  password,
  firstName,
  lastName,
}: SignUpParams): Promise<void> => {
  const params = {
    user_name,
    password,
    firstName,
    lastName,
  };

  try {
    const res = await axios.post(endpoints.auth.signUp, params);

    const { tokenData } = res.data;
    console.log("tokenData: ",tokenData);
    if (!tokenData) {
      throw new Error('Access token not found in response');
    }

    sessionStorage.setItem(STORAGE_KEY, tokenData.token);
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async (): Promise<void> => {
  try {
    await setSession(null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
