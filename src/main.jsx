import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import { Analytics } from '@vercel/analytics/react'
import { StatsigProvider, useClientAsyncInit } from '@statsig/react-bindings'
import { StatsigAutoCapturePlugin } from '@statsig/web-analytics'
import { StatsigSessionReplayPlugin } from '@statsig/session-replay'

function StatsigWrapper({ children }) {
  const { client } = useClientAsyncInit(
    'client-AAlwX4CFhzss58hT9tWcgDxYwETPxveHB4OuXr9iTvP',
    { userID: 'a-user' },
    { plugins: [new StatsigAutoCapturePlugin(), new StatsigSessionReplayPlugin()] },
  )
  return (
    <StatsigProvider client={client} loadingComponent={<div>Loading...</div>}>
      {children}
    </StatsigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StatsigWrapper>
      <App />
      <Analytics />
    </StatsigWrapper>
  </React.StrictMode>,
)
