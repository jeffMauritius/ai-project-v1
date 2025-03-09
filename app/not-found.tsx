import { Button } from "@/components/ui/button"
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">404 - Page Not Found</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Sorry, the page you are looking for does not exist.</p>
      <Button asChild className="mt-6">
        <Link href="/">
          Go back to Home
        </Link>
      </Button>
    </div>
  )
}