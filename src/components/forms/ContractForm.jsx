import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import ReactTooltip from 'react-tooltip'
import { ethers } from 'ethers'
import { Save } from 'react-feather'
import { withApollo, graphql } from 'react-apollo'
import { Link } from 'react-router-dom'

import { AddressInput } from '~/components/AddressInput'
import { AbiSelect } from '~/components/forms/AbiSelect'
import { ABIUpload } from '~/components/ABIUpload'
import { NetworkSelect } from '~/components/forms/NetworkSelect'
import { createContractMutation } from '~/mutations/createContractMutation'
import { notusToast } from '~/utils/notusToast'
import { showErrorMessage } from '~/utils/showErrorMessage'
import { etherscanAbiQuery } from '~/queries/etherscanAbiQuery'
import { currentUserQuery } from '~/queries/currentUserQuery'
import * as routes from '~/../config/routes'

const debug = require('debug')('notus:components:ContractForm')

export const ContractForm = 
  withApollo(
    graphql(currentUserQuery, { name: 'currentUserQuery' })(
      graphql(createContractMutation, { name: 'createContractMutation' })(
        class _ContractForm extends PureComponent {
          state = {
            contract: {
              address: '',
              name: '',
              networkId: 1,
              abi: {
                id: null,
                name: '',
                abi: ''
              }
            },
            hasCustomizedName: false
          }

          static propTypes = {
            redirectToContractPage: PropTypes.func.isRequired,
          }

          handleToggleEditingNetwork = (newValue) => {
            // debug('handleToggleEditingNetwork', newValue)
            this.setState({ editingNetwork: newValue })
          }

          handleToggleAbiSelect = (newValue) => {
            this.setState({ editingAbi: newValue })
          }

          handleNameChange = (e) => {
            this.setState({
              contract: {
                ...this.state.contract,
                name: e.target.value,
                abi: {
                  ...this.state.contract.abi,
                  name: e.target.value
                }
              },
              hasCustomizedName: true
            })
          }

          handleAddressChange = (e) => {
            this.setState({
              contract: {
                ...this.state.contract,
                address: e.target.value
              }
            })
          }

          handleAbiChange = (e) => {
            this.setState({
              contract: {
                ...this.state.contract,
                abi: {
                  abi: e.target.value
                }
              }
            })
          }

          handleNetworkIdChange = (networkId, networkName) => {
            this.setState({
              contract: {
                ...this.state.contract,
                networkId: parseInt(networkId, 10)
              }
            })
          }

          handleAbi = ({ name, abi }) => {
            const newName = this.state.hasCustomizedName
              ? this.state.contract.name
              : name

            this.setState({
              contract: {
                ...this.state.contract,
                name: newName,
                abi: {
                  name: newName,
                  abi: JSON.stringify(abi, null, 2)
                }
              }
            })
          }

          handleAbiError = (message, files) => {
            console.log('err ', message, files)
          }

          handleSubmit = (e) => {
            e.preventDefault()

            if (this.invalid()) { 
              showErrorMessage(this.invalidMessage())
              return
            }

            const variables = {
              contract: this.state.contract
            }

            this.props.createContractMutation({
              variables,
              refetchQueries: ['contractsQuery']
            }).then(({ data }) => {
              notusToast.success('Contract added successfully')
              this.props.redirectToContractPage(
                parseInt(data.createContract.id, 10)
              )
            }).catch(error => {
              console.warn(error)

              error = {
                message: `Please format your ABI code correctly (${error.message})`
              }

              showErrorMessage(error)
            })
          }

          addressIsValid = () => {
            try {
              ethers.utils.getAddress(this.state.contract.address)
              return true
            } catch {
              return false
            }
          }

          invalid = () => {
            return (
              !this.addressIsValid()
              || this.state.contract.name === ''
              || this.state.contract.abi === ''
            )
          }

          invalidMessage = () => {
            return 'Please enter a contract address, name and ABI (as JSON) for the new Contract.'
          }

          showErrorTooltip = () => {
            if (this.invalid()) {
              ReactTooltip.show(ReactDOM.findDOMNode(this.refs.errorTooltip))
            }
          }

          hideErrorTooltip = () => {
            ReactTooltip.hide(ReactDOM.findDOMNode(this.refs.errorTooltip))
          }

          onPullAbiFromEtherscan = async () => {
            if (!this.props.currentUserQuery.currentUser.etherscan_api_key) {
              notusToast.error(
                <span>
                  You need to add your Etherscan API key: <Link to={routes.ACCOUNT_SETTINGS}>Update your Settings</Link>
                </span>
              )
              return
            }

            if (!this.state.contract.address) {
              notusToast.error('You must enter an address')
              return
            }

            const variables = {
              address: this.state.contract.address,
              networkId: this.state.contract.networkId
            }

            console.log(variables)

            const response = await this.props.client.query({
              query: etherscanAbiQuery,
              variables
            })
            
            const { abiString } = response.data.etherscanAbi

            if (abiString) {
              this.setState({
                contract: {
                  ...this.state.contract,
                  abi: {
                    abi: abiString
                  }
                }
              })
            }
      
          }

          handleChangeAbi = (value) => {
            debug('handleChangeAbi value', value)
            this.setState({
              contract: {
                ...this.state.contract,
                abi: {
                  ...this.state.abi,
                  id: value.abiId
                }
              }
            })
          }

          render () {
            return (
              <div className='form'>
                <div className='field'>
                  Network: 
                  <NetworkSelect
                    networkId={parseInt(this.state.contract.networkId, 10)}
                    onChangeNetworkId={this.handleNetworkIdChange}
                    handleToggleEditingNetwork={this.handleToggleEditingNetwork}
                  />
                </div>
                
                <div className='field'>
                  <AddressInput
                    onChange={this.handleAddressChange}
                    placeholder={`Contract Address`}
                    value={this.state.contract.address}
                  />
                </div>

                <div className='field'>
                  <input
                    className='input'
                    type='text'
                    value={this.state.contract.name}
                    onChange={this.handleNameChange}
                    placeholder={`Contract Name`}
                  />
                </div>

                <div className='field'>
                  ABI:
                  <AbiSelect
                    abiId={parseInt(this.state.contract.abi.id, 10)}
                    handleChangeAbi={this.handleChangeAbi}
                    handleToggleAbiSelect={this.handleToggleAbiSelect}
                  />
                </div>

                {/* <div className='field'>
                  <button
                    className='button is-link is-outlined'
                    onClick={this.onPullAbiFromEtherscan}
                  >
                    Pull ABI from Etherscan
                  </button>
                </div> */}

                <div className='has-text-centered pb20'>&mdash; or &mdash;</div>

                <div className='field'>
                  <ABIUpload
                    onAbi={this.handleAbi}
                    onError={this.handleAbiError}
                  />
                </div>

                <div className='has-text-centered pb20'>&mdash; or &mdash;</div>

                <div className='field'>
                  <textarea
                    className='textarea'
                    value={this.state.contract.abi.abi}
                    onChange={this.handleAbiChange}
                    placeholder={`Paste Contract ABI (JSON) here ...`}
                  />
                </div>

                <div className='buttons mt30 has-text-right has-margin-left-auto'>
                  <ReactTooltip
                    id='new-admin-contract-form-hint'
                    place='top'
                    effect='solid'
                  />

                  <span
                    data-for='new-admin-contract-form-hint'
                    data-tip={this.invalid() ? this.invalidMessage() : ''}
                  >
                    <button
                      className='button is-success has-stroke-white has-fat-icons'
                      onClick={this.handleSubmit}
                      disabled={this.invalid()}
                    >
                      <Save
                        className='has-stroke-white'
                      />&nbsp;Save contract
                    </button>
                  </span>
                </div>
              </div>
            )
          }
        }
      )
    )
  )
