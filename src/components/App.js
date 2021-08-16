import { Tabs, Tab } from 'react-bootstrap'
import idleDAI from '../abis/idleDAI.json'
import React, { Component } from 'react';
import DAI from '../abis/DAI.json'
import idledai from '../idledai.png';
import Web3 from 'web3';
import './App.css';

const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const idleDaiContractAddress = '0x3fE7940616e5Bc47b0775a0dccf6237893353bB4';

class App extends Component {

  async componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    if(typeof window.ethereum!=='undefined'){
      const web3 = new Web3(window.ethereum)
      //const netId = await web3.eth.net.getId()
      const accounts = await web3.eth.getAccounts()

      //load balance
      if(typeof accounts[0] !=='undefined'){
        const balance = await web3.eth.getBalance(accounts[0])
        this.setState({account: accounts[0], balance: balance, web3: web3})
      } else {
        window.alert('Please login with MetaMask')
      }

      //load contracts
      try {
        const token = new web3.eth.Contract(DAI, daiAddress)
        const idledai = new web3.eth.Contract(idleDAI, idleDaiContractAddress)
        this.setState({token: token, idledai: idledai, idleDAIAddress: idleDAI})
      } catch (e) {
        console.log('Error', e)
        window.alert('Contracts not deployed to the current network')
      }

    } else {
      window.alert('Please install MetaMask')
    }
  }

  async lend(amount) {
    if(this.state.idledai!=='undefined'){
      try{
        await this.state.token.methods.approve(this.state.account, amount.toString()).send({from: this.state.account})
        .on('transactionHash', function(hash){
            console.log(hash)
        })
        .on('receipt', function(receipt){
          console.log(receipt)
        })
        .on('confirmation', function(confirmationNumber, receipt){
          console.log(confirmationNumber, receipt)
        })
        .on('error', function(error, receipt) {
          console.log(error, receipt)
        });
        await this.state.idledai.methods.mintIdleDAI(amount.toString(), false, this.state.account).send({from: this.state.account})
        .on('transactionHash', function(hash){
          console.log(hash)
        })
        .on('receipt', function(receipt){
          console.log(receipt)
        })
        .on('confirmation', function(confirmationNumber, receipt){
          console.log(confirmationNumber, receipt)
        })
        .on('error', function(error, receipt) {
          console.log(error, receipt)
        });
      } catch (e) {
        console.log('Error, lend: ', e)
      }
    }
  }

  async redeem(e) {
    e.preventDefault()
    if(this.state.idledai!=='undefined'){
      try{
        await this.state.idledai.methods.redeem().send({from: this.state.account})
      } catch(e) {
        console.log('Error, redeem: ', e)
      }
    }
  }


  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      token: null,
      idledai: null,
      balance: 0,
      idleDAIAddress: null
    }
  }

  render() {
    return (
      <div className='text-monospace'>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="http://www.dappuniversity.com/bootcamp"
            target="_blank"
            rel="noopener noreferrer"
          >
        <img src={idledai} className="App-logo" alt="logo" height="32"/>
          <b>DAI interest machine</b>
        </a>
        </nav>
        <div className="container-fluid mt-5 text-center">
        <br></br>
          <h1>Welcome </h1><h2>{this.state.account}</h2>
          <br></br>
          
          <h1>to the DAI interest machine by IDLE finance</h1>
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
              <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example">
                <Tab eventKey="lend" title="Lend">
                  <div>
                  <br></br>
                    Lend DAI
                    
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      let amount = this.lendAmount.value
                      amount = amount * 10**18 //convert to wei
                      this.lend(amount)
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='lendAmount'
                          step="0.01"
                          type='number'
                          ref={(input) => { this.lendAmount = input }}
                          className="form-control form-control-md"
                          placeholder='amount...'
                          required />
                      </div>
                      <button type='submit' className='btn btn-primary'>Lend</button>
                    </form>

                  </div>
                </Tab>
                <Tab eventKey="redeem" title="Redeem">
                  <br></br>
                    Do you want to redeem + take interest?
                    <br></br>
                    <br></br>
                  <div>
                    <button type='submit' className='btn btn-primary' onClick={(e) => this.redeem(e)}>Redeem</button>
                  </div>
                </Tab>
                
              </Tabs>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
