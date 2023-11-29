import { GetStaticProps } from 'next';
import Head from 'next/head';
import { getPrismicClient } from '../../services/prismic';
import Prismic from "@prismicio/client";
import Link from 'next/link';

import { RichText } from 'prismic-dom';

import styles from './styles.module.scss'

type Post = {
  slug: string,
  title: string,
  excerpt: string,
  updatedAt: Date
}
interface PostPros {
  posts: Post[]
}

// export default - toda página precisa ser default
export default function ({ posts }: PostPros) {
  return (
    <>
      <Head>
        <title>Posts | Ignews</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (

            <Link href={`/posts/${post.slug}`}>
              <a key={post.slug} href="#">
                <time>{post.updatedAt}</time>
                <strong>{post.title}</strong>
                <p>{post.excerpt}</p>
              </a>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}


export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query<any>([
    Prismic.predicates.at('document.type', 'post'), // qual tipo de documento estou buscando  "posts" (quer eu criei no prismic)
  ], {
    fetch: ['post.title', 'post.content'], // quais conteúdos quero buscar dos "posts" ( title e content)
    pageSize: 100,
  })

  // console.log(response)
  // Dica console.log para apresentar  o conteúdo  de dentro um array ou objeto em cascata
  /* console.log(JSON.stringify(response, null, 2)) */

  //console.log(JSON.stringify(response, null, 2))
  // sempre formatar dados após recebe-los de uma api (ganho de processamento) 
  const posts = response.results.map(post => {
    return {
      slug: post.uid,
      title: RichText.asText(post.data.title),
      excerpt: post.data.content.find(content => content.type === 'paragraph')?.text ?? '',
      updatedAt: new Date(post.last_publication_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    }
  })

  return {
    props: {
      posts
    }
  }

}