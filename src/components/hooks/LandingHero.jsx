import React from 'react'
import { SignupForm } from '~/components/SignupForm'

export const LandingHero = ({ heroColor }) => {
  return (
    <section className={`hero ${heroColor}`}>
      <div className='hero-body'>
        <div className='container'>
          <div className='row'>
          
            <div className='col-xs-12 col-lg-8'>
              <h1 className='hero--title'>
                Ethereum notifications made simple.
              </h1>

              <h6 className='is-size-6 hero--description-text'>
                {/* /texts/emails/slacks */}
                Notus enables you to listen in on Ethereum. Whether it's token transfers or contract activity, Notus has your back.
              </h6>

              <div className='mt30'>
                <SignupForm />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
