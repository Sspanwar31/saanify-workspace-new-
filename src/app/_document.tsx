import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Document Not Found',
  description: 'The requested document could not be found.',
}

export default function DocumentNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Document Not Found</h1>
        <p className="text-lg text-gray-600">The document you're looking for could not be found.</p>
        <p className="text-gray-500 mt-4">
          Please check the URL and try again.
        </p>
      </div>
    </div>
  )
}