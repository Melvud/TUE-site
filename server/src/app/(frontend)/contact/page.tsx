import Section from '@/components/Section'
import ContactForm from '@/components/ContactForm'

export default function ContactPage() {
  return (
    <div className="bg-slate-900 text-white">
      <div className="pt-28 pb-10 text-center">
        <h1 className="text-4xl font-extrabold">Contact Us</h1>
        <p className="text-slate-300 mt-2">We usually reply within 1–2 days.</p>
      </div>

      <Section>
        <ContactForm />
      </Section>
    </div>
  )
}