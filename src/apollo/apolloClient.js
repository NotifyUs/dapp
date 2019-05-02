import { onError } from 'apollo-link-error'
import { ApolloClient } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import { setContext } from 'apollo-link-context'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { merge } from 'lodash'
import { metadataResolvers } from './client-state/metadataResolvers'
import { notusResolvers } from './client-state/notusResolvers'
import { storage } from '~/apollo/storage'
import { signIn } from '~/apollo/signIn'

// const debug = require('debug')('notus:apolloClient')

export const apolloClient = async () => {
  const cache = new InMemoryCache()

  const resolvers = merge(
    {},
    metadataResolvers,
    notusResolvers
  )

  let jwtToken = null

  if (storage()) {
    jwtToken = window.localStorage.getItem('jwtToken')
  }

  if (jwtToken) {
    await signIn(cache, jwtToken)
  }

  const httpLink = createHttpLink({
    uri: `${process.env.REACT_APP_NOTUS_API_URI}/graphql`
  })

  const authLink = setContext((_, { headers }) => {
    let token

    // get the authentication token from local storage if it exists
    if (storage()) {
      token = window.localStorage.getItem('jwtToken')
    }

    // return the headers to the context so httpLink can read them
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : ''
      }
    }
  })

  const errorLink = onError((data) => {
    const { graphQLErrors, networkError } = data
    if (graphQLErrors) {
      graphQLErrors.map(({ message, locations, path }) =>
        console.warn(
          `[GraphQL error]: Message: `, message, ` Location: `, locations, ` Path: `, path, data
        )
      )
    }
    if (networkError) console.error(`[Network error]: ${networkError}`)
  })

  return new ApolloClient({
    resolvers: { ...resolvers },
    link: errorLink.concat(authLink.concat(httpLink)),
    uri: `${process.env.REACT_APP_NOTUS_API_URI}/graphql`,
    cache
  })
}
