import { GetStaticPaths, GetStaticProps } from "next"
import { useSession } from "next-auth/client";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { RichText } from "prismic-dom";
import { useEffect } from "react";
import { getPrismicClient } from "../../../services/prismic";

import styles from '../../posts/post.module.scss';

interface PostPreviewProps {
  post: {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
  }
}

export default function PostPreview({ post }: PostPreviewProps) {
  // verificação do usuario logado será feito aqui no  PostPreview

  const [session] = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.activeSubscription) {
      router.push(`/posts/${post.slug}`);
    }
  }, [session]);

  return (
    <>
      <Head>
        <title>{post.title} | Ignews</title>
      </Head>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.title}</h1>
          <time>{post.updatedAt}</time>

          <div
            className={`${styles.postContent} ${styles.previewContent}`}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className={styles.continueReading}>
            Wanna continue reading?
            <Link href="/">
              <a href="">Subscribe now 🤗</a>
            </Link>
          </div>
        </article>
      </main>
    </>
  )

}

export const getStaticPaths: GetStaticPaths = async() => {
  return {
    paths: [
      { params: { slug: 'axios---um-cliente-http-full-stack' } },
    ],
    fallback: 'blocking',
  }
}

// toda página puyblica é estática
export const getStaticProps: GetStaticProps = async ({ params }) => {

  /* 
    a verificação se um usuário esta logado, não pode ser feita no context do getStaticProps 
    pois ele é executado em um context onde não possui informaçõe de um usuário logado
    */

  const { slug } = params;

  const prismic = getPrismicClient()

  const response = await prismic.getByUID<any>('post', String(slug), {})

  const post = {
    slug,
    title: RichText.asText(response.data.title),
    content: RichText.asHtml(response.data.content.splice(0, 3)),
    updatedAt: new Date(response.last_publication_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return {
    props: {
      post,

    },
    redirect: 60 * 30 // refresh da página a cada 30 minutos
  }
}
