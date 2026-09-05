import { BrandMark } from './components/brand/BrandMark'
import { Spinner } from './components/ui/Spinner'

export default function App() {
  return (
    <main className="boot-screen">
      <BrandMark />
      <Spinner label="Đang chuẩn bị không gian trò chuyện…" />
    </main>
  )
}
