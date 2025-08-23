import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <main className='flex h-screen items-center justify-center'>
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          redirectUrl="/dashboard"
        />
    </main>
  ) 
}
