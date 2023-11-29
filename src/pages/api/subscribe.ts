import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { fauna } from "../../services/fauna";
import { stripe } from "../../services/stripe";
import { query as q } from 'faunadb'

type User = {
  ref: {
    id: string
  },

  data: { 
    stripe_customer_id: string
  }
}
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if(req.method === 'POST'){
    //criar um customer dentro do painel do stripe
    // como não tenho acesso ao useSession que é um hook usado no front, preciso buscar os dados do usuário pelos cookies
    const session = await getSession({ req }); // getSession é um hook do next-auth que permite buscar os dados do usuário que estão no cookies

    const user = await fauna.query<User>(
      q.Get(
        q.Match(
          q.Index('user_by_email'),
          q.Casefold(session.user.email)
        )
      )
    )

    let customerId = user.data.stripe_customer_id
    
    if(!customerId){
      const stripeCustomer =  await stripe.customers.create({ // criando um customer dentro do stripe
        email: session.user.email, 
      });

      await fauna.query(
        q.Update(
          q.Ref(q.Collection('users'), user.ref.id),
          { 
            data: { 
              stripe_customer_id: stripeCustomer.id
            }
          }
        )
      )
      customerId = stripeCustomer.id
    }



    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      // customer: stripeCustomer.id, // id do customer no stripe e não do bd fauna
      customer: customerId,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        { price: 'price_1JdhVpLqo9S6IBBoqOank3ty', quantity: 1 },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    })

    return res.status(200).json({ sessionId: stripeCheckoutSession.id });
  } else { 
    res.setHeader('Allow', 'POST');
    res.status(405).end(`Method Not Allowed`);
  }
}