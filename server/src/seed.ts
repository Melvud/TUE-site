import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function seed() {
  const payload = await getPayload({ config })

  console.log('🌱 Starting seed...')

  // 1. Home global
  await payload.updateGlobal({
    slug: 'home',
    data: {
      typedPhrases: [
        { value: 'Join us today and enjoy a free OPTICA subscription!' },
        { value: 'Connect with the photonics community at TU/e.' },
        { value: 'Workshops, talks, cleanroom tours, and more.' },
      ],
    },
  })

  console.log('✅ Home global created!')

  // 2. About global - БЕЗ секций (добавите через админку)
  await payload.updateGlobal({
    slug: 'about',
    data: {
      sections: [], // ← Пустой массив вместо секций с null
    },
  })

  console.log('✅ About global created!')

  // 3. Join global
  await payload.updateGlobal({
    slug: 'join',
    data: {
      introText: {
        root: {
          type: 'root',
          children: [
            {
              type: 'heading',
              children: [{ type: 'text', text: 'Join the Photonics Society Eindhoven' }],
              tag: 'h2',
            },
            {
              type: 'paragraph',
              children: [
                { 
                  type: 'text', 
                  text: 'Apply to become a member and unlock exclusive benefits.' 
                }
              ],
            },
          ],
        },
      },
      detailsHtml: {
        root: {
          type: 'root',
          children: [
            {
              type: 'heading',
              children: [{ type: 'text', text: 'Why Join PhE?' }],
              tag: 'h3',
            },
            {
              type: 'paragraph',
              children: [
                { 
                  type: 'text', 
                  text: 'The Photonics Society Eindhoven (PhE) is your gateway to the photonics community at TU/e and beyond.' 
                }
              ],
            },
            {
              type: 'heading',
              children: [{ type: 'text', text: 'Membership Benefits' }],
              tag: 'h3',
            },
            {
              type: 'list',
              listType: 'bullet',
              children: [
                {
                  type: 'listitem',
                  children: [
                    { 
                      type: 'text', 
                      text: '🎟️ Priority access to event registrations' 
                    }
                  ],
                },
                {
                  type: 'listitem',
                  children: [
                    { 
                      type: 'text', 
                      text: '📚 Free OPTICA student membership ($22 value)' 
                    }
                  ],
                },
                {
                  type: 'listitem',
                  children: [
                    { 
                      type: 'text', 
                      text: '💬 Exclusive Telegram community with mentorship & networking' 
                    }
                  ],
                },
                {
                  type: 'listitem',
                  children: [
                    { 
                      type: 'text', 
                      text: '🔬 Access to cleanroom tours and industry site visits' 
                    }
                  ],
                },
              ],
            },
          ],
        },
      },
      formFields: [
        { 
          name: 'name', 
          label: 'Full Name', 
          type: 'text', 
          required: true, 
          placeholder: 'John Doe' 
        },
        { 
          name: 'email', 
          label: 'Email Address', 
          type: 'email', 
          required: true, 
          placeholder: 'j.doe@student.tue.nl' 
        },
        { 
          name: 'affiliation', 
          label: 'Affiliation', 
          type: 'text', 
          required: false, 
          placeholder: 'TU/e, MSc Photonics' 
        },
        { 
          name: 'studentStatus', 
          label: 'I am a...', 
          type: 'select', 
          required: true,
          options: [
            { value: 'Bachelor Student' },
            { value: 'Master Student' },
            { value: 'PhD Candidate' },
            { value: 'Researcher/Staff' },
            { value: 'Industry Professional' },
            { value: 'Other' },
          ]
        },
        { 
          name: 'message', 
          label: 'Why do you want to join PhE?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Share your interest in photonics and what you hope to gain from membership...' 
        },
      ],
    },
  })

  console.log('✅ Join global created!')
  
  console.log('\n🎉 Seed complete!')
  console.log('\n📝 Next steps:')
  console.log('1. Run: pnpm dev')
  console.log('2. Open: http://localhost:3000/admin')
  console.log('3. Upload hero image: Collections → Media')
  console.log('4. Configure home: Globals → Home → Hero → Image')
  console.log('5. Add about sections: Globals → About → Sections')
  
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})