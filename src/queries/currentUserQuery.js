import gql from 'graphql-tag'

export const currentUserQuery = gql`
  query currentUserQuery {
    currentUser @client {
      id
      email
    }
  }
`