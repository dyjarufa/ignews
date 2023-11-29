import Head from 'next/head'
import { SubscribeButton } from '../components/SubscribeButton'
// import { GetServerSideProps } from 'next'
import { GetStaticProps } from 'next'
 
import styles from './home.module.scss'
import { stripe } from '../services/stripe'

/* 3 formas de popular uma página com informações */
// Client Side (Component Function)
// Server Side (SSR)
// Static site Generation (SSG)

type HomeProps = {
  product: {
    priceId: string,
    amount: number
  }
}

export default function Home({ product }: HomeProps) {
  //console.log(props) //apresenta na tela
  return (
    <>
      <Head>
        <title>Home | ig.news</title>
      </Head>

      <main className={styles.contentContainer}>
        <section className={styles.hero}>
          <span>👏 Hey, Welcome!</span>
          <h1>
            News about <br /> the <span>React</span> world
          </h1>
          <p>Get access to all publications <br />
            <span>for {product.amount} month</span>
          </p>

          <SubscribeButton priceId={product.priceId} />
        </section>

        <img src="/images/avatar.svg" alt="girl coding" />
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  //console.log("Ok!!") //rodando do lado do servidor(nodejs)

  const price = await stripe.prices.retrieve('price_1JdhVpLqo9S6IBBoqOank3ty', { //retrieve significa que quero pegar apenas um preço
    expand: ['product'] //expand quero todas as informações do produto
  })

  const product = {
    priceId: price.id,
    amount: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price.unit_amount / 100) //Essa divisão em centavos é para ter uma melhor manipulaçao  no banco
  }

  return {
    props: {
      product
    },
    revalidate: 60 * 60 * 24, // 24 horas
  }
}
