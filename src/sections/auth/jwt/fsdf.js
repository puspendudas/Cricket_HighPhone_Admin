// import axios from 'axios';

// import { useLoaderContext } from '../loader/contectLoader'; // Adjust path as needed

// const baseUrl = import.meta.env.VITE_BASE_URL;

// const api = axios.create({
//   baseURL: baseUrl,
//   headers: {
//     'Access-Control-Allow-Origin': import.meta.env.VITE_CURRENT_URL,
//     'Access-Control-Allow-Methods': 'OPTIONS, HEAD, GET, POST, PUT, DELETE',
//     'Access-Control-Allow-Headers':
//       'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
//     'X-Requested-With': '*',
//   },
// });

// const getToken = () => localStorage.getItem('token');

// const interceptorsSetup = (showLoader, hideLoader) => {
//   // Add request interceptor to dynamically attach token
//   api.interceptors.request.use(
//     async (config) => {
//       showLoader();
//       const token = getToken();
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//       // Remove content-type header for FormData
//       if (config.data instanceof FormData) {
//         delete config.headers['Content-Type'];
//       }
//       return config;
//     },
//     (error) => {
//       hideLoader();
//       return Promise.reject(error);
//     }
//   );

//   // Add response interceptor to hide the loader
//   api.interceptors.response.use(
//     (response) => {
//       hideLoader();
//       return response;
//     },
//     (error) => {
//       hideLoader();
//       return Promise.reject(error);
//     }
//   );
// };

// // Initialize interceptors outside the hooks to avoid multiple setups
// let interceptorsInitialized = false;

// export const useApi = () => {
//   const { showLoader, hideLoader } = useLoaderContext();

//   // Initialize interceptors only once
//   if (!interceptorsInitialized) {
//     interceptorsSetup(showLoader, hideLoader);
//     interceptorsInitialized = true;
//   }

//   // Exporting API methods individually
//   const get = async (url, params = {}) => {
//     const response = await api.get(url, { params });
//     return response.data;
//   };

//   const post = async (url, data) => {
//     const response = await api.post(url, data);
//     return response.data;
//   };

//   const put = async (url, data) => {
//     const response = await api.put(url, data);
//     return response.data;
//   };

//   const patch = async (url, data) => {
//     const response = await api.patch(url, data);
//     return response.data;
//   };

//   const deleted = async (url, data) => {
//     const response = await api.delete(url, { data });
//     return response.data;
//   };

//   return { get, post, put, patch, deleted };
// };




// login<<<<<<<<>>>>>>>>>>>>>>><<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>



// import { z as zod } from 'zod';
// import { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';

// import Link from '@mui/material/Link';
// import Alert from '@mui/material/Alert';
// import Stack from '@mui/material/Stack';
// import IconButton from '@mui/material/IconButton';
// import Typography from '@mui/material/Typography';
// import LoadingButton from '@mui/lab/LoadingButton';
// import InputAdornment from '@mui/material/InputAdornment';

// import { paths } from 'src/routes/paths';
// import { useRouter } from 'src/routes/hooks';
// import { RouterLink } from 'src/routes/components';

// import { useBoolean } from 'src/hooks/use-boolean';

// import { Iconify } from 'src/components/iconify';
// import { Form, Field } from 'src/components/hook-form';

// import { useAuthContext } from 'src/auth/hooks';
// import { signInWithPassword } from 'src/auth/context/jwt';

// // ----------------------------------------------------------------------

// export type SignInSchemaType = zod.infer<typeof SignInSchema>;

// export const SignInSchema = zod.object({
//   email: zod
//     .string()
//     .min(1, { message: 'Email is required!' })
//     .email({ message: 'Email must be a valid email address!' }),
//   password: zod
//     .string()
//     .min(1, { message: 'Password is required!' })
//     .min(6, { message: 'Password must be at least 6 characters!' }),
// });

// // ----------------------------------------------------------------------

// export function JwtSignInView() {
//   const router = useRouter();

//   const { checkUserSession } = useAuthContext();

//   const [errorMsg, setErrorMsg] = useState('');

//   const password = useBoolean();

//   const defaultValues = {
//     email: 'demo@minimals.cc',
//     password: '@demo1',
//   };

//   const methods = useForm<SignInSchemaType>({
//     resolver: zodResolver(SignInSchema),
//     defaultValues,
//   });

//   const {
//     handleSubmit,
//     formState: { isSubmitting },
//   } = methods;

//   const onSubmit = handleSubmit(async (data) => {
//     try {
//       await signInWithPassword({ email: data.email, password: data.password });
//       await checkUserSession?.();

//       router.refresh();
//     } catch (error) {
//       console.error(error);
//       setErrorMsg(error instanceof Error ? error.message : error);
//     }
//   });

//   const renderHead = (
//     <Stack spacing={1.5} sx={{ mb: 5 }}>
//       <Typography variant="h5">Sign in to your account</Typography>

//       <Stack direction="row" spacing={0.5}>
//         <Typography variant="body2" sx={{ color: 'text.secondary' }}>
//           {`Don't have an account?`}
//         </Typography>

//         <Link component={RouterLink} href={paths.auth.jwt.signUp} variant="subtitle2">
//           Get started
//         </Link>
//       </Stack>
//     </Stack>
//   );

//   const renderForm = (
//     <Stack spacing={3}>
//       <Field.Text name="email" label="Email address" InputLabelProps={{ shrink: true }} />

//       <Stack spacing={1.5}>
//         <Link
//           component={RouterLink}
//           href="#"
//           variant="body2"
//           color="inherit"
//           sx={{ alignSelf: 'flex-end' }}
//         >
//           Forgot password?
//         </Link>

//         <Field.Text
//           name="password"
//           label="Password"
//           placeholder="6+ characters"
//           type={password.value ? 'text' : 'password'}
//           InputLabelProps={{ shrink: true }}
//           InputProps={{
//             endAdornment: (
//               <InputAdornment position="end">
//                 <IconButton onClick={password.onToggle} edge="end">
//                   <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
//                 </IconButton>
//               </InputAdornment>
//             ),
//           }}
//         />
//       </Stack>

//       <LoadingButton
//         fullWidth
//         color="inherit"
//         size="large"
//         type="submit"
//         variant="contained"
//         loading={isSubmitting}
//         loadingIndicator="Sign in..."
//       >
//         Sign in
//       </LoadingButton>
//     </Stack>
//   );

//   return (
//     <>
//       {renderHead}

//       <Alert severity="info" sx={{ mb: 3 }}>
//         Use <strong>{defaultValues.email}</strong>
//         {' with password '}
//         <strong>{defaultValues.password}</strong>
//       </Alert>

//       {!!errorMsg && (
//         <Alert severity="error" sx={{ mb: 3 }}>
//           {errorMsg}
//         </Alert>
//       )}

//       <Form methods={methods} onSubmit={onSubmit}>
//         {renderForm}
//       </Form>
//     </>
//   );
// }
