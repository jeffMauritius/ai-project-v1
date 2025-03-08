export default function Custom500() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">500 - Server-side error occurred</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Sorry, something went wrong on our end.</p>
        <a href="/" className="mt-6 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-500">
          Go back to Home
        </a>
      </div>
    )
  }