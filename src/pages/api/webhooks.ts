import { NextApiRequest, NextApiResponse } from "next"
import { Readable } from 'stream'
import Stripe from "stripe"
import { stripe } from '../../services/stripe' 
import { saveSubscriptions } from "./_lib/manageSubscription"

async function buffer( readable: Readable) {
  const chunks = []

  for await (const chunk of readable) {
    chunks.push(
      typeof chunk === 'string' ? Buffer.from(chunk) : chunk
    )
  }

  return Buffer.concat(chunks)
}

// essa config informa que irá desabilitar o entendimento de requisições do next( ex: json)
// aqui a requisição será chegada como Stream, então informo que o next irá tratar como Stream
export const config = {
  api: {
    bodyParser: false,
  }
}

// Defini quais eventos a aplicação irá ouvir (checkout.session.completed)
const relevantEvents = new Set([
  "checkout.session.completed",
  // "customer.subscription.created",
  "customer.subscription.updated",
  'customer.subscription.deleted',
])


export default async (req: NextApiRequest, res: NextApiResponse) => {
  if(req.method === 'POST') {
    const buf = await buffer(req)
    const secret = req.headers['stripe-signature'] // na documentação do stripe, no header é enviado essa informação stripe-signature

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (error) {
      console.log("gerou um erro: ",error)
      return res.status(400).send(`Webhook Error: ${error.message}`)
    }

    const {  type } = event

    if(relevantEvents.has(type)) {
      console.log('evento recebido: ', event)
      try {
        switch(type) {
          //case "customer.subscription.created": // evento para criação de subscriptions
          case "customer.subscription.updated": // evento para alteração
          case 'customer.subscription.deleted': //evento para alteração

          const subscription = event.data.object as Stripe.Subscription

          await saveSubscriptions(
            subscription.id,
            subscription.customer.toString(),
            //type === "customer.subscription.created"
            false
          )

          break;

          case 'checkout.session.completed': // evento para criação de subscriptions

          const checkoutSession = event.data.object as Stripe.Checkout.Session

          await saveSubscriptions(
            checkoutSession.subscription.toString(),
            checkoutSession.customer.toString(),
            true
          )

            break;

          default:
            throw new Error('Unhandled event type')
        }
      } catch (err) {
        console.log(err)  
        return res.json({ error: 'Webhook handler failed' })
      }
    }

    return res.json({ received: true})
  }else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method Not Allowed`)
  }

}
