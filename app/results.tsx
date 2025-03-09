import { Button } from "@/components/ui/button"
import Link from 'next/link'

export default function Results() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Results Page</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Here are the results.</p>
      <Button asChild className="mt-6">
        <Link href="/">
          Go back to Home
        </Link>
      </Button>
    </div>
  )
}