import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

// import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
// import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';
import { signInWithPassword } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

export type SignInSchemaType = zod.infer<typeof SignInSchema>;


//  >>>>>>>>>>>>this validation for number <<<<<<<<<<<


// export const SignInSchema = zod.object({
//   user_name: zod
//     .string()
//     .min(10, { message: 'user_name number must be exactly 10 digits!' })
//     .max(10, { message: 'user_name number must be exactly 10 digits!' })
//     .regex(/^[6-9]\d{9}$/, { message: 'user_name number must be a valid Indian number!' }),
//   password: zod
//     .string()
//     .min(1, { message: 'Password is required!' })
//     .min(6, { message: 'Password must be at least 6 characters!' }),
// });

// >>>>>>>>>>>>> this validation for 6 characters <<<<<<<<<<<<
export const SignInSchema = zod.object({
  user_name: zod
    .string()
    .min(4, { message: 'username must be at least 6 characters!' })
    .regex(/^[a-zA-Z0-9_]{4,15}$/, {
      message: 'username must contain both letters and numbers!',
    }),
  password: zod
    .string()
    .min(1, { message: 'Password is required!' })
    .min(5, { message: 'Password must be at least 6 characters!' }),
});

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const router = useRouter();

  const { checkUserSession } = useAuthContext();

  const [errorMsg, setErrorMsg] = useState('');

  const password = useBoolean();

  const defaultValues = {
    user_name: '',
    password: '',
  };

  const methods = useForm<SignInSchemaType>({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // const onSubmit = handleSubmit(async (data) => {
  //   try {
  //     await signInWithPassword({ user_name: data.user_name, password: data.password });
  //     await checkUserSession?.();

  //     router.refresh();
  //   } catch (error) {
  //     console.error(error);
  //     setErrorMsg(error instanceof Error ? error.message : error);
  //   }
  // });
  const onSubmit = handleSubmit(async (data) => {
    try {
      await signInWithPassword({ user_name: data.user_name, password: data.password });
      await checkUserSession?.();

        router.push('/dashboard'); 
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else if (typeof error === 'string') {
        setErrorMsg(error);
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        setErrorMsg(String((error as any).message));
      } else {
        setErrorMsg('Something went wrong!');
      }
    }
  });

  const renderHead = (
    <Stack spacing={1.5} sx={{ mb: 5 }}>
      <Typography variant="h5">Sign in to your account</Typography>

      {/* <Stack direction="row" spacing={0.5}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {`Don't have an account?`}
        </Typography>

        <Link component={RouterLink} href={paths.auth.jwt.signUp} variant="subtitle2">
          Get started
        </Link>
      </Stack> */}
    </Stack>
  );

  const renderForm = (
    <Stack spacing={3}>
      <Field.Text name="user_name" label="User Name " InputLabelProps={{ shrink: true }} />

      <Stack spacing={1.5}>
        {/* <Link
          component={RouterLink}
          href="#"
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          Forgot password?
        </Link> */}

        <Field.Text
          name="password"
          label="Password"
          placeholder="6+ characters"
          type={password.value ? 'text' : 'password'}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={password.onToggle} edge="end">
                  <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Sign in..."
      >
        Sign in
      </LoadingButton>
    </Stack>
  );

  return (
    <>
      {renderHead}

      <Alert severity="info" sx={{ mb: 3 }}>
        Please enter your username number and password.
      </Alert>

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>
    </>
  );
}
