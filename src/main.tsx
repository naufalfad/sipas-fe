import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import AppProviders from './app/providers'
import { router } from './app/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <Toaster position="top-right" expand={false} richColors />
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
