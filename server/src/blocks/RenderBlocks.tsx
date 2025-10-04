import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

// Import the individual block components used to render the layout. We
// mirror the upstream imports and extend them with our custom
// components. Each component corresponds to a block defined in
// `config.ts`. The names follow the pattern `<BlockName>Block` to
// match the `interfaceName` set in the block config.
import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { MarqueeBlock } from '@/blocks/Marquee/Component'
import { TextImageBlock } from '@/blocks/TextImage/Component'
import { JoinUsBlock } from '@/blocks/JoinUs/Component'

// A mapping between block slugs (as stored in the database) and the
// corresponding React component. When rendering a page we iterate
// through the blocks array and look up the appropriate component to
// instantiate. Extending this object allows us to support new block
// types without changing the rendering loop below.
const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  marquee: MarqueeBlock,
  textImage: TextImageBlock,
  joinUs: JoinUsBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType as keyof typeof blockComponents]

            if (Block) {
              return (
                <div className="my-16" key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...(block as any)} disableInnerContainer />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}