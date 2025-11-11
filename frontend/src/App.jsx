import { BrowserRouter as Router } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#030F3C',
            },
            success: {
              iconTheme: {
                primary: '#27AE60',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#E74C3C',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-suscc-blue mb-4">
              SUSCC Adjunct Instructor Tracker
            </h1>
            <p className="text-lg text-gray-600">
              System initializing... Please wait while we set up your environment.
            </p>
            <div className="mt-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-suscc-blue"></div>
            </div>
          </div>
        </div>
      </div>
    </Router>
  )
}

export default App
