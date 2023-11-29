import { useSession, signIn } from 'next-auth/client';
import { api } from '../../services/api';
import { getStripeJs } from '../../services/stripe-js';
import styles from './styles.module.scss';
import { useRouter } from 'next/router';

type PriceProps = {
  priceId: string,
}

export function SubscribeButton({ priceId }: PriceProps) {

  const [session] = useSession();
  const router = useRouter();

  async function handleSubscribe() {
    if (!session) {
      signIn('github')
      return; // evita que o código continue sendo executado
    }

    // se o usuário já tem um assinatura, redireiono para para /posts
    if(session.activeSubscription){
      // uso do router de forma programática ao invés de clicar em um botão
      router.push('/posts');
      return
    }

    try {
      const response = await api.post('/subscribe')

      const { sessionId } = response.data;

      const stripe = await getStripeJs();

      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      alert(error.message)
    }

  }

  return (
    <button
      type="button"
      className={styles.subscribeButton}
      onClick={handleSubscribe}
    >

      Subscribe now
    </button>
  )
}