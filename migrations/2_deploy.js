const DAI = artifacts.require("DAI");
const IdleTokenGovernance = artifacts.require("IdleTokenGovernance");

module.exports = async function(deployer) {
	//deploy Token
	await deployer.deploy(DAI)

	//assign token into variable to get it's address
	const dai = await DAI.deployed()
	
	//pass token address for idleFountain contract(for future minting)
	await deployer.deploy(IdleTokenGovernance, dai.address)

	//assign idleFountain contract into variable to get it's address
	const idle = await IdleTokenGovernance.deployed()

	//change token's owner/minter from deployer to idleFountain
	await dai.passMinterRole(idle.address)
};