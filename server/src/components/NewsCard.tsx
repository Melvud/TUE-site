import Link from 'next/link'

type Props = {
  article: {
    id?: string | number
    slug?: string
    title: string
    date?: string
    author?: string
    cover?: any
    summary?: string
  }
}

export default function NewsCard({ article }: Props) {
  const imageUrl = typeof article.cover === 'object' && article.cover?.url ? article.cover.url : ''
  const href = article.slug ? `/news/${article.slug}` : '#'
  const dateStr = article.date ? new Date(article.date).toLocaleDateString() : ''

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-2 transition-transform duration-300 flex flex-col">
      <Link href={href}>
        {imageUrl && <img src={imageUrl} alt={article.title} className="w-full h-56 object-cover" />}
      </Link>
      <div className="p-6 flex flex-col flex-grow">
        {(dateStr || article.author) && (
          <p className="text-slate-500 text-sm mb-2">
            {dateStr}
            {dateStr && article.author && ' • '}
            {article.author}
          </p>
        )}
        <h3 className="text-xl font-bold text-white mb-3 flex-grow">
          <Link href={href} className="hover:text-cyan-400 transition-colors">
            {article.title}
          </Link>
        </h3>
        {article.summary && <p className="text-slate-400 mb-4 line-clamp-4">{article.summary}</p>}
        <div className="mt-auto">
          <Link href={href} className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
            Read More →
          </Link>
        </div>
      </div>
    </div>
  )
}