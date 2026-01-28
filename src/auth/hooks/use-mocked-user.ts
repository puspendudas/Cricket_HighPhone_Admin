import { useState, useEffect } from 'react';

import { _mock } from 'src/_mock';
import useMeApi from 'src/Api/me/useMeApi';

export function useMockedUser() {
  const { fetchMe } = useMeApi();

  const [user, setUser] = useState({
    id: '',
    name: '',
    email: '',
    photoURL: _mock.image.avatar(24),
    phoneNumber: '',
    country: '',
    address: '',
    state: '',
    city: '',
    zipCode: '',
    about: '',
    role: '',
    isPublic: true,
    share: 0,
    match_commission: 0,
    session_commission: 0,
    casino_commission: 0,
    wallet: 0,
    password: '', 
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetchMe();
        if (response && response.data) {
          const apiUser = response.data;
          setUser({
            id: apiUser._id || '',
            name: apiUser.name || 'Guest User',
            email: '',
            photoURL: _mock.image.avatar(24),
            phoneNumber: apiUser.mobile || 'Not provided',
            country: '',
            address: '',
            state: '',
            city: '',
            zipCode: '',
            about: '',
            role: apiUser.type || 'user',
            isPublic: true,
            share: apiUser.share || 0,
            match_commission: apiUser.match_commission || 0,
            session_commission: apiUser.session_commission || 0,
            casino_commission: apiUser.casino_commission || 0,
            wallet: apiUser.wallet || 0,
            password: apiUser.password || '', 
          });
        }
      } catch (err) {
        setError(err);
        console.error('Failed to fetch user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, loading, error };
}



// import { _mock } from 'src/_mock';

// To get the user from the <AuthContext/>, you can use

// Change:
// import { useMockedUser } from 'src/auth/hooks';
// const { user } = useMockedUser();

// To:
// import { useAuthContext } from 'src/auth/hooks';
// const { user } = useAuthContext();

// ----------------------------------------------------------------------

// export function useMockedUser() {
//   const user = {
//     id: '8864c717-587d-472a-929a-8e5f298024da-0',
//     displayName: 'Jaydon Frankie',
//     email: 'demo@minimals.cc',
//     photoURL: _mock.image.avatar(24),
//     phoneNumber: _mock.phoneNumber(1),
//     country: _mock.countryNames(1),
//     address: '90210 Broadway Blvd',
//     state: 'California',
//     city: 'San Francisco',
//     zipCode: '94116',
//     about: 'Praesent turpis. Phasellus viverra nulla ut metus varius laoreet. Phasellus tempus.',
//     role: 'admin',
//     isPublic: true,
//   };

//   return { user };
// }

