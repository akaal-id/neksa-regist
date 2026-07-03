import { sanitizeRichText, hasRichTextContent } from '../../lib/richText'
import styles from './RichTextContent.module.css'

type RichTextContentProps = {
  html?: string | null
  className?: string
  fallback?: string
}

export default function RichTextContent({
  html,
  className,
  fallback = 'Join us for an unforgettable experience.',
}: RichTextContentProps) {
  if (!hasRichTextContent(html)) {
    return <p className={className}>{fallback}</p>
  }

  const sanitized = sanitizeRichText(html!)

  return (
    <div
      className={[styles.content, className].filter(Boolean).join(' ')}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
