import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Webhook payload:', body)

    // Handle different webhook types
    if (body.type === 'user.created' || body.type === 'user.updated') {
      const { id, email_addresses, first_name, image_url } = body.data

      if (!id) {
        console.error('No user ID in webhook payload')
        return new NextResponse('No user ID provided', { status: 400 })
      }

      const email = email_addresses?.[0]?.email_address
      if (!email) {
        console.error('No email in webhook payload')
        return new NextResponse('No email provided', { status: 400 })
      }

      try {
        // First check if user exists
        const existingUser = await db.user.findUnique({
          where: { clerkId: id }
        });

        if (!existingUser) {
          // Create new user
          const user = await db.user.create({
            data: {
              clerkId: id,
              email,
              name: first_name || '',
              profileImage: image_url || '',
            }
          });
          console.log('New user created:', user);
        } else {
          // Update existing user
          const user = await db.user.update({
            where: { clerkId: id },
            data: {
              email,
              name: first_name || '',
              profileImage: image_url || '',
            }
          });
          console.log('User updated:', user);
        }

        return new NextResponse('User updated in database successfully', {
          status: 200,
        })
      } catch (error) {
        console.error('Database error:', error)
        return new NextResponse('Database error', { status: 500 })
      }
    }

    return new NextResponse('Webhook type not handled', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Error processing webhook', { status: 500 })
  }
}
