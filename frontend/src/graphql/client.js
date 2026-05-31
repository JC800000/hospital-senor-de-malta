import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client'
import { onError } from '@apollo/client/link/error'

const errorLink = onError(({ graphQLErrors }) => {
  const isExpired = graphQLErrors?.some(e => e.message.includes('Signature has expired'))
  if (isExpired) {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('usuario')
    window.location.href = '/login'
  }
})

const authLink = new ApolloLink((operation, forward) => {
  const token = sessionStorage.getItem('token')
  if (token) {
    operation.setContext({
      headers: { Authorization: `JWT ${token}` },
    })
  }
  return forward(operation)
})

const httpLink = createHttpLink({ uri: '/graphql/' })

export default new ApolloClient({
  link: errorLink.concat(authLink).concat(httpLink),
  cache: new InMemoryCache(),
})
