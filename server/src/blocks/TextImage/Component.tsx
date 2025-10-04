import React from 'react'
import RichText from '@/components/RichText'

// Локальные пропсы
type TextImageProps = {
  image?: unknown
  imagePosition?: 'left' | 'right'
  richText?: unknown
}

export const TextImageBlock: React.FC<TextImageProps> = ({
  image,
  imagePosition = 'left',
  richText,
}) => {
  // Определяем URL из relation-to-media
  let imageUrl = ''
  if (typeof image === 'object' && image !== null && 'url' in (image as any)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imageUrl = (image as any).url as string
  }

  const ImageElement = (
    <div className="w-full md:w-1/2">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="w-full h-auto" />
      )}
    </div>
  )

  const TextElement = (
    <div className="w-full md:w-1/2 p-4">
      {richText && <RichText data={richText} />}
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row my-8 items-center">
      {imagePosition === 'left' ? (
        <>
          {ImageElement}
          {TextElement}
        </>
      ) : (
        <>
          {TextElement}
          {ImageElement}
        </>
      )}
    </div>
  )
}
