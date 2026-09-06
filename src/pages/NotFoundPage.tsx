import { Link } from 'react-router-dom'
import { BrandMark } from '../components/brand/BrandMark'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return <main className="not-found"><BrandMark /><span>404</span><h1>This page wandered off</h1><p>The conversation you are looking for may have moved somewhere else.</p><Button><Link to="/">Back to messages</Link></Button></main>
}
