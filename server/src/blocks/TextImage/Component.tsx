import React from 'react'

import type { TextImageBlock } from '@/payload-types'
import RichText from '@/components/RichText'

/**
 * Renders a responsive text and image block. The image and rich text are
 * displayed side‑by‑side on medium and larger screens and stacked on
 * smaller screens. The `imagePosition` determines whether the image
 * appears on the left or right.
 */
export const TextImageBlock: React.FC<TextImageBlock> = ({
  image,
  imagePosition = 'left',
  richText,
}) => {
  // Determine the URL from the image relation. The payload `media`
  // relation returns an object containing a `url` property when the
  // document is included by default. Fallback to empty string.
  let imageUrl = ''
  if (typeof image === 'object' && image !== null && 'url' in image) {
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