import { Tabs, Tab } from 'react-bootstrap'
import idleDAI from '../abis/idleDAI.json'
import React, { Component } from 'react';
import DAI from '../abis/DAI.json'
import idledai from '../idledai.png';
import Web3 from 'web3';
import './App.css';
import { useLoading, Puff } from '@agney/react-loading';

const web3 = new Web3(window.ethereum)

const daiAddress = '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa';
const idleDaiContractAddress = '0x295CA5bC5153698162dDbcE5dF50E436a58BA21e';

let minABI = [
  // balanceOf
  {
    "constant":true,
    "inputs":[{"name":"_owner","type":"address"}],
    "name":"balanceOf",
    "outputs":[{"name":"balance","type":"uint256"}],
    "type":"function"
  },
  // decimals
  {
    "constant":true,
    "inputs":[],
    "name":"decimals",
    "outputs":[{"name":"","type":"uint8"}],
    "type":"function"
  },
  // transfer
 {
  "constant": false,
  "inputs": [
   {
    "name": "_to",
    "type": "address"
   },
   {
    "name": "_value",
    "type": "uint256"
   }
  ],
  "name": "transfer",
  "outputs": [
   {
    "name": "",
    "type": "bool"
   }
  ],
  "type": "function"
 }
];

let contract = new web3.eth.Contract(minABI,daiAddress);

class App extends Component {


  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      token: null,
      idledai: null,
      balanceEth: 0,
      idleDAIAddress: null,
      loading: false,
      indicator: <Puff width="70" />
    }

    this.loadingChange = this.loadingChange.bind(this)
    this.lend = this.lend.bind(this)
  }

  async componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }

  async getBalance(walletAddress) {
    let balance = await contract.methods.balanceOf(walletAddress).call();
    return web3.utils.fromWei(balance, 'ether');
  } 

  async loadBlockchainData(dispatch) {
    if(typeof window.ethereum!=='undefined'){
      
      //const netId = await web3.eth.net.getId()
      const accounts = await web3.eth.getAccounts()

      //load balance
      if(typeof accounts[0] !=='undefined'){
        const balance = await web3.eth.getBalance(accounts[0])
        const tokenBalance = await this.getBalance(accounts[0])
        
        let balanceFromWei = parseFloat(web3.utils.fromWei(balance, 'ether'), 10)
        console.log(balanceFromWei)
        this.setState({account: accounts[0], balanceEth: balanceFromWei.toFixed(5), balanceIdle: tokenBalance, web3: web3})
      } else {
        window.alert('Please login with MetaMask')
      }

      //load contracts
      try {
        const token = new web3.eth.Contract(DAI, daiAddress)
        const idledai = new web3.eth.Contract(idleDAI, idleDaiContractAddress)
        const idleTokens = await idledai.methods.getGovTokensAmounts(accounts[0]).call();

        this.setState({token: token, idledai: idledai, idleDAIAddress: idleDAI, idleTokensAvailable: idleTokens[0]})
      } catch (e) {
        console.log('Error', e)
        window.alert('Contracts not deployed to the current network')
      }

    } else {
      window.alert('Please install MetaMask')
    }
  }

  

  loadingChange(state) {
    this.setState({loading: state})
  }


   lend = async (amount) => {
    if (this.state.idledai!=='undefined') {
      const _this = this;
      try{
        await this.state.token.methods.approve(this.state.account, amount.toString()).send({from: this.state.account})
        .on('transactionHash', function(hash){
            //TODO LOADING
            _this.loadingChange(true)
            console.log(hash)
        })
        .on('receipt', function(receipt){
          //TODO SUCCESS
          _this.loadingChange(false)
          console.log(receipt)
        })
        .on('confirmation', function(confirmationNumber, receipt){
          //console.log(confirmationNumber, receipt)
        })
        .on('error', function(error, receipt) {
          _this.loadingChange(false)
          console.log(error)
          //console.log(error, receipt)
        });

      
        await this.state.idledai.methods.mintIdleToken(
          amount.toString(), false, this.state.account)
          .send({from: this.state.account})
        .on('transactionHash', function(hash) { 
          _this.loadingChange(true)
          console.log(hash)
        })
        .on('receipt', function(receipt){
          _this.loadingChange(false)
          console.log(receipt)
        })
        .on('confirmation', function(confirmationNumber, receipt){
          //console.log(confirmationNumber, receipt)
        })
        .on('error', function(error, receipt) {
          _this.loadingChange(false)
          console.log(error, receipt)
        });
      } catch (e) {
        _this.loadingChange(false)
        console.log('Error, lend: ', e)
      }
    }
  }


  

  async redeem(e) {
    e.preventDefault()
    if(this.state.idledai!=='undefined'){
      const _this = this;
      try{
        await this.state.idledai.methods.redeemIdleToken(this.state.balanceIdle).send({from: this.state.account})
        .on('transactionHash', function(hash) { 
          _this.loadingChange(true)
          console.log(hash)
        })
        .on('receipt', function(receipt){
          _this.loadingChange(false)
          console.log(receipt)
        })
        .on('confirmation', function(confirmationNumber, receipt){
          //console.log(confirmationNumber, receipt)
        })
        .on('error', function(error, receipt) {
          _this.loadingChange(false)
          console.log(error, receipt)
        });
      } catch(e) {
        _this.loadingChange(false)
        console.log('Error, redeem: ', e)
      }
    }
  }


  

  render() {
    let { loading, indicator } = this.state
    let headerLoading = 'Processing transaction...'
    let redeemForm = <div>
    <br></br>
      Do you want to redeem + take interest?
      <br></br>
      <br></br>
    <div>
      <button type='submit' className='btn btn-primary' onClick={(e) => this.redeem(e)}>Redeem</button>
    </div>
    </div>
    let lendForm = <div>
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
            placeholder='Amount...'
            required />
        </div>
        <button type='submit' className='btn btn-primary'>Lend</button>
      </form>

    </div>
    if (loading ==! true) {
      indicator = ''
      headerLoading = ''
    } else {
      redeemForm = ''
      lendForm = ''
    }
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
          
          <h1>{this.state.balanceEth} ETH</h1>
          <h1>{this.state.balanceIdle} DAI</h1>
          <h1>{this.state.idleTokensAvailable} IDLE</h1>
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
              <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example">
                <Tab eventKey="lend" title="Lend">
                <section>
                  {headerLoading}
                  {indicator}
                </section>
                  {lendForm}
                </Tab>
                <Tab eventKey="redeem" title="Redeem">
                <section>
                  {headerLoading}
                  {indicator}
                </section>
                  {redeemForm}
              
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
