import { axiosInstance } from '~/../config/axiosInstance'
import { DappUserFragment } from '~/fragments/DappUserFragment'
import { currentUserQuery } from '~/queries/currentUserQuery'

export const notusResolvers = {
  Query: {
    dappUser: async function (object, args, options, info) {
      const { dappUserId } = args
      if (!dappUserId) { throw new Error('You must pass the dappUserId') }
      return axiosInstance
        .get(`${process.env.REACT_APP_NOTUS_API_URI}/dapp-users/${dappUserId}`)
        .then(json => {
          const id = `DappUser:${json.id}`
          return options.writeFragment({id, fragment: DappUserFragment, data: json })
        })
    }
  },

  Mutation: {
    signIn: async function (object, args, { cache }, info) {
      const { email, password } = args
      if (!email) {
        throw new Error('email must be provided')
      }
      if (!password) {
        throw new Error('password must be provided')
      }

      console.log('sending: ', email, password)

      return axiosInstance.get(`${process.env.REACT_APP_NOTUS_API_URI}/sign-in`, {
        params: {
          email, password
        }
      }).then(response => {
        console.log('received ', response)
        const { data } = response
        const jwtToken = data || ''
        cache.writeData({ data: { jwtToken } })
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`
        return axiosInstance
          .get(`${process.env.REACT_APP_NOTUS_API_URI}/users`)
          .then(userResponse => {
            const { data } = userResponse
            data.__typename = 'User'
            cache.writeQuery({
              query: currentUserQuery,
              data: {
                currentUser: data
              }
            })
          })
      })
    },

    confirmUser:  async function (object, args, { cache }, info) {
      const { oneTimeKey, password } = args
      if (!oneTimeKey) {
        throw new Error('oneTimeKey is not defined')
      }
      if (!password) {
        throw new Error('You must pass a password')
      }
      return axiosInstance
        .post(`${process.env.REACT_APP_NOTUS_API_URI}/users/confirm`, {
          password
        }, {
          headers: {
            'Authorization': `Bearer ${oneTimeKey}`
          }
        })
        .then(confirmResponse => {
          const { data } = confirmResponse
          const jwtToken = data || ''
          cache.writeData({ data: { jwtToken } })
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`
          return axiosInstance
            .get(`${process.env.REACT_APP_NOTUS_API_URI}/users`)
            .then(userResponse => {
              const { data } = userResponse
              data.__typename = 'User'
              cache.writeQuery({
                query: currentUserQuery,
                data: {
                  currentUser: data
                }
              })
            })
        }).catch(error => {
          console.error(error)
        })
    },

    confirmDappUser: async function (object, args, { cache }, info) {
      console.log('starting confirmDappUser: ')
      const { requestKey } = args
      if (!requestKey) {
        throw new Error('requestKey is not defined')
      }
      return axiosInstance
        .post(`${process.env.REACT_APP_NOTUS_API_URI}/dapp-users/confirm`, { requestKey })
        .then(json => {
          return json
        })
    }
  }
}
