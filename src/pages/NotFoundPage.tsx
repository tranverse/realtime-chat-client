import { Link } from 'react-router-dom'
import { BrandMark } from '../components/brand/BrandMark'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return <main className="not-found"><BrandMark /><span>404</span><h1>Trang này đã đi lạc</h1><p>Cuộc trò chuyện bạn tìm có thể đã được chuyển sang nơi khác.</p><Button><Link to="/">Về trang chính</Link></Button></main>
}
