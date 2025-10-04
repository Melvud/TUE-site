'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'

export const EmailInstructions: React.FC = () => {
  const provider = useFormFields(([fields]) => fields?.provider?.value as string)

  const instructions = {
    gmail: {
      title: '📧 Gmail Setup Instructions',
      steps: [
        {
          title: '1. Enable 2-Step Verification',
          content: (
            <>
              <p>Go to: <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Account Security</a></p>
              <p>Enable "2-Step Verification"</p>
            </>
          ),
        },
        {
          title: '2. Create App Password',
          content: (
            <>
              <p>Go to: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">App Passwords</a></p>
              <p>Select "App" → "Other (Custom name)"</p>
              <p>Enter "PhE Website" and click "Generate"</p>
              <p>Copy the 16-character password (format: xxxx xxxx xxxx xxxx)</p>
            </>
          ),
        },
        {
          title: '3. Fill in Settings',
          content: (
            <>
              <p><strong>Gmail Address:</strong> your-email@gmail.com</p>
              <p><strong>App Password:</strong> Paste the 16-character password</p>
              <p><strong>From Name:</strong> PhE Team (or any display name)</p>
            </>
          ),
        },
      ],
      note: '⚠️ Use App Password, NOT your regular Gmail password!',
    },
    sendgrid: {
      title: '📨 SendGrid Setup Instructions',
      steps: [
        {
          title: '1. Create SendGrid Account',
          content: (
            <>
              <p>Sign up at: <a href="https://signup.sendgrid.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">SendGrid</a></p>
              <p>Free tier: 100 emails/day</p>
            </>
          ),
        },
        {
          title: '2. Verify Sender Email',
          content: (
            <>
              <p>Go to: Settings → Sender Authentication</p>
              <p>Verify your email address or domain (phe.tue.nl)</p>
              <p>For domain verification, add DNS records to your domain</p>
            </>
          ),
        },
        {
          title: '3. Create API Key',
          content: (
            <>
              <p>Go to: Settings → API Keys</p>
              <p>Click "Create API Key"</p>
              <p>Name: "PhE Website"</p>
              <p>Permissions: "Full Access" or "Mail Send"</p>
              <p>Copy the API key (starts with SG.)</p>
            </>
          ),
        },
        {
          title: '4. Fill in Settings',
          content: (
            <>
              <p><strong>API Key:</strong> SG.xxxxxxxxxxxxxxxxxx</p>
              <p><strong>From Email:</strong> noreply@phe.tue.nl (must be verified)</p>
              <p><strong>From Name:</strong> PhE Team</p>
            </>
          ),
        },
      ],
      note: '✅ SendGrid is recommended for production use',
    },
    mailgun: {
      title: '📮 Mailgun Setup Instructions',
      steps: [
        {
          title: '1. Create Mailgun Account',
          content: (
            <>
              <p>Sign up at: <a href="https://signup.mailgun.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Mailgun</a></p>
              <p>Free tier: 5,000 emails/month (first 3 months)</p>
            </>
          ),
        },
        {
          title: '2. Add Domain',
          content: (
            <>
              <p>Go to: Sending → Domains</p>
              <p>Add your domain (mg.phe.tue.nl recommended for subdomain)</p>
              <p>Add DNS records to verify domain</p>
            </>
          ),
        },
        {
          title: '3. Get API Key',
          content: (
            <>
              <p>Go to: Settings → API Keys</p>
              <p>Copy your "Private API key"</p>
            </>
          ),
        },
        {
          title: '4. Fill in Settings',
          content: (
            <>
              <p><strong>API Key:</strong> Your private API key</p>
              <p><strong>Domain:</strong> mg.phe.tue.nl</p>
              <p><strong>From Email:</strong> noreply@mg.phe.tue.nl</p>
            </>
          ),
        },
      ],
      note: 'ℹ️ Requires DNS configuration',
    },
    custom: {
      title: '🔧 Custom SMTP Setup',
      steps: [
        {
          title: 'Common SMTP Providers',
          content: (
            <div className="space-y-2">
              <p><strong>Gmail:</strong></p>
              <p className="pl-4">Host: smtp.gmail.com, Port: 587</p>
              
              <p><strong>Outlook/Office 365:</strong></p>
              <p className="pl-4">Host: smtp.office365.com, Port: 587</p>
              
              <p><strong>Yahoo:</strong></p>
              <p className="pl-4">Host: smtp.mail.yahoo.com, Port: 587</p>
              
              <p><strong>Your Email Provider:</strong></p>
              <p className="pl-4">Check your email provider's SMTP settings</p>
            </div>
          ),
        },
        {
          title: 'Port Information',
          content: (
            <>
              <p><strong>Port 587:</strong> TLS (recommended, Use SSL/TLS = OFF)</p>
              <p><strong>Port 465:</strong> SSL (Use SSL/TLS = ON)</p>
              <p><strong>Port 25:</strong> Unencrypted (not recommended)</p>
            </>
          ),
        },
      ],
      note: '🔐 Always use encrypted connection (port 587 or 465)',
    },
  }

  const currentInstructions = instructions[provider as keyof typeof instructions] || instructions.gmail

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">{currentInstructions.title}</h2>
      
      <div className="space-y-6">
        {currentInstructions.steps.map((step, index) => (
          <div key={index} className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <div className="text-gray-700 space-y-2">
              {step.content}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800 font-medium">{currentInstructions.note}</p>
      </div>

      {provider === 'sendgrid' && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800">
            <strong>💡 Tip:</strong> For phe.tue.nl domain, you need access to DNS settings. 
            Contact your domain administrator to add the required DNS records.
          </p>
        </div>
      )}
    </div>
  )
}