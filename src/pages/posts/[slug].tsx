/* 
[slug] - arquivo criado com um colchete: Dentro das pastas ou dentro das api's  
routes quando uma página é dinâmica (ex: vou ter vários posts) 

url: localhost:3000/posts/[slug] - localhost:3000/posts/qualquer-coisa
*/

import { GetServerSideProps } from "next"
import { getSession } from "next-auth/client";
import Head from "next/head";
import { RichText } from "prismic-dom";
import { getPrismicClient } from "../../services/prismic";
import styles from './post.module.scss';

interface PostProps {
  post: {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
  }
}

export default function Posts({ post }: PostProps) {

  return (
    <>
      <Head>
        <title>{post.title} | Ignews</title>
      </Head>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.title}</h1>
          <time>{post.updatedAt}</time>
          {/* setar um html dentro da div - ter muito cuidado ao usar pois pode ser executado scripts  */}
          <div 
          className={styles.postContent}
          dangerouslySetInnerHTML={{__html: post.content}} 
          />
        </article>
      </main>
    </>
  )

}


// toda pasta que for gerada de forma estática, não pode ser protegida (usuario autenticado)
// Por isso vou usar o GetServerSideProps (isso fará com que seja realizada uma
// chamada no prismic a todo momento, porém garanto que o usuário estará autenticado).

export const getServerSideProps: GetServerSideProps = async ({ req, params }) => { // consigo pegar a requisição (req)
  const session = await getSession({ req }); // com o getSession() do next-auth consigo pegar os cookies do usuário para saber se esta logado ou não
  const { slug } = params; // é possivel pegar o slug de dentro do params

  if (!session?.activeSubscription) {
    // dentro do getServerSideProps para fazer um redirecionamento podemos redirecionar o usuário para uma página de erro
    return {
      redirect: { 
        destination: '/', // página de destino
        permanent: false, // não é permanente, estratégia para indexadores do google e crawlers
      }
    }
  }

  console.log(session)

  const prismic = getPrismicClient(req) // carregar o cliente do prismic


  /* 
    getByUID: método que existe dentro prismic para eu buscar um documento pelo seu UID (aqui será slug)
    publication: Tipo do documento que eu quero buscar
    String(slug): inicialmente a tipagem do slug pode ser um array ou não, neste caso ele será apenas um string, então posso forçar que ele se torne UMa string e não várias
   */
  const response = await prismic.getByUID<any>('post', String(slug), {})

  const post = {
    slug,
    title: RichText.asText(response.data.title),
    content: RichText.asHtml(response.data.content),
    updatedAt: new Date(response.last_publication_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return {
    props: {
      post,
    }
  }
}
