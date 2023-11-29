import NextAuth from "next-auth"
import Providers from "next-auth/providers"

import { fauna } from '../../../services/fauna'

import { query as q } from 'faunadb'
import { session } from "next-auth/client"


export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // Scope do Oauth significa quais informações do usuário quero acessar
      //docs: https://docs.github.com/pt/developers/apps/building-oauth-apps/scopes-for-oauth-apps
      scope: 'read:user'
    }),
  ],

  callbacks: {

    async session(session) {
      try {
        const userActiveSubscription = await fauna.query(
          q.Get( // Esse get por fora esta buscando a subscription por uma ref do usuário e a ref eu busco ppelo email
            q.Intersection([// Intersecção é um operador que retorna o que está em ambas as listas
              q.Match(
                q.Index('subscription_by_user_ref'),
                q.Select( // o select informa quais dados quero do select = Get
                  'ref', // Não quero todos, quero apenas um: 'ref'
                  q.Get( // tras os dados
                    q.Match( // equivalente ao where do BD
                      q.Index('user_by_email'), // busco no fauna no index user_by_email
                      q.Casefold(session.user.email) // por esse email
                    )
                  )
                )
              ),
              q.Match( // me traz todas as assinaturas ativas
                q.Index('subscription_by_status'),
                'active'
              )
            ])
          )
        )
        return {
          ...session,
          activeSubscription: userActiveSubscription
        }
      } catch {
        return {
          ...session,
          activeSubscription: null
        }
      }

    },

    // verificar se o usuário tem uma isncrição ativa
    async signIn(user, account, profile) {
      const { email } = user;

      try {
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(
                q.Match( // igual ao where do bd
                  q.Index('user_by_email'),
                  q.Casefold(user.email)
                )
              )
            ),
            q.Create(
              q.Collection('users'),
              { data: { email } }
            ),
            q.Get( // aqui seria o else // Caso o usuário já exista, busco como Get (select do bd)
              q.Match(
                q.Index('user_by_email'),
                q.Casefold(user.email)
              )
            )
          )
        )

        return true

      } catch (e) {
        console.log(e)
        return false
      }
    },
  }
})