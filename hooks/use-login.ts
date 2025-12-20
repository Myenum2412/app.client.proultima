import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface LoginFormData {
  email: string
  password: string
}

interface LoginResponse {
  user: any
  session: any
}

export function useLogin() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: LoginFormData): Promise<LoginResponse> => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      return response.json()
    },
    onSuccess: async () => {
      toast.success('Login successful! Redirecting...')
      // Introduce 1-second loading delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'An error occurred during login')
    },
  })
}

