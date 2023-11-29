// o "_" na frente da pasta informa que essa pasta não será um a rota

import { query as q, query } from "faunadb";
import { fauna } from "../../../services/fauna";
import { stripe } from "../../../services/stripe";

export async function saveSubscriptions(
  subscriptionId: string,
  customerId: string,
  createActions = false
) {
  // Buscar o usuário no banco de dados do FaunaDB com o ID {customerID}
  console.log(subscriptionId, customerId);

  const useRef = await fauna.query(
    q.Select(
      "ref", //especifico para o fauna qual é exatamente o campo que eu quero
      q.Get(q.Match(q.Index("user_by_stripe_customer_id"), customerId))
    )
  );

  // No webhook, irá informar apenas os id da subscriptions

  // eu preciso de todos os dados da subscriptions
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const subscriptionData = {
    id: subscription.id,
    userId: useRef,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
  };

  console.log(subscriptionData);

  if (createActions) {
    await fauna
      .query(
        q.Create(q.Collection("subscriptions"), { data: subscriptionData })
      )
      .catch((err) => {
        console.log(err);
      });
  } else {
    await fauna.query(
      q.Replace(
        q.Select(
          "ref",
          q.Get(
            q.Match(
              q.Index("subscription_by_id"),
              subscriptionId
            )
          )
        ),
        { data: subscriptionData }
      )
    )
  }
}
