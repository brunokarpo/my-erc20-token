const BrunoShare = artifacts.require("BrunoShare.sol");

const { catchRevert } = require('./exceptions.js');

contract("BrunoShare", async accounts => {

	describe("when create contract", async () => {

		it("should verify token name", async() => {
			let instance = await BrunoShare.deployed();

			let tokenName = await instance.name.call();
			assert.equal(tokenName, "Bruno Coin", "The token name is incorrect");
		});

		it("should verify token symbol", async () => {
			let instance = await BrunoShare.deployed();

			let tokenSymbol = await instance.symbol.call();

			assert.equal(tokenSymbol, "BRC", "The token symbol is incorrect");
		});

		it("should verify decimal support", async () => {
			let instance = await BrunoShare.deployed();

			let decimals = (await instance.decimals.call()).toNumber();

			assert.equal(decimals, 0, "Decimal support is incorrect");
		});

		it("should verify total supply", async () => {
			let instance = await BrunoShare.deployed();

			let totalSupply = (await instance.totalSupply.call()).toNumber();
			const decimals = Math.pow(10, ((await instance.decimals.call()).toNumber()));

			assert.equal(totalSupply, 1000*decimals, "Total supply is incorrect");
		});
		
	});

	describe("when buying tokens", async() => {

		it("should buy tokens by ethers", async() => {
			let instance = await BrunoShare.deployed();
			const decimals = Math.pow(10, ((await instance.decimals.call()).toNumber()));

			const accountAmountBefore = (await instance.balanceOf(accounts[1])).toNumber();

			await instance.buy({ from: accounts[1], value: 2000000000000000000});

			const accountAmountAfter = (await instance.balanceOf(accounts[1])).toNumber();

			assert.equal(accountAmountAfter, accountAmountBefore + (2*decimals), "Balance is incorrect");
		});

		it("should send received ether to contract owner account", async () => {
			let instance = await BrunoShare.deployed();

			const ownerAccountBalanceBefore = await web3.utils.fromWei(await web3.eth.getBalance(accounts[0])); // pega o valor arredondado em ETH no formato string
			const ownerAccountBalanceBeforeAmount = parseFloat(ownerAccountBalanceBefore) // transforma em float para conseguir fazer calculos e manipulações

			await instance.buy({ from: accounts[1], value: 2000000000000000000});

			const ownerAccountBalanceAfter = await web3.utils.fromWei(await web3.eth.getBalance(accounts[0]));
			const ownerAccountBalanceAfterAmount = parseFloat(ownerAccountBalanceAfter)

			assert.equal(ownerAccountBalanceAfterAmount, ownerAccountBalanceBeforeAmount + 2);
		});

		it("should decrease the amount of tokens from contract", async () => {
			let instance = await BrunoShare.deployed();
			const decimals = Math.pow(10, ((await instance.decimals.call()).toNumber()));

			const availableTokensBefore = (await instance.availableTokens.call()).toNumber();

			await instance.buy({ from: accounts[2], value: 3000000000000000000});

			const availableTokensAfter = (await instance.availableTokens.call()).toNumber();

			assert.equal(availableTokensAfter, availableTokensBefore - (3*decimals));
		});

		it("should emit event when buying tokens", async () => {
			let instance = await BrunoShare.deployed();
			const decimals = Math.pow(10, ((await instance.decimals.call()).toNumber()));

			const receipt = await instance.buy({ from: accounts[3], value: 10000000000000000000});

			assert.equal(receipt.logs[0].args._from, instance.address);
			assert.equal(receipt.logs[0].args._to, accounts[3]);
			assert.equal(receipt.logs[0].args._value.toNumber(), 10*decimals);
		});

		/*
		 *	Testes para fazer mais para o final:
		 *	* Não pode comprar mais tokens do que tem disponíveis
		 *	* Validar a existência de tokens antes de comprar
		 */

	});

	describe("when having tokens", async () => {
		it("should send tokens between accounts", async () => {
			let instance = await BrunoShare.deployed();
			const decimals = Math.pow(10, ((await instance.decimals.call()).toNumber()));

			const alice = accounts[4];
			const bob = accounts[5];
			const aliceAmount = (await instance.balanceOf(alice)).toNumber();
			const bobAmount = (await instance.balanceOf(bob)).toNumber();

			await instance.buy({ from: alice, value: 10000000000000000000});

			await instance.transfer(bob, 4*decimals, { from: alice });

			assert.equal((await instance.balanceOf(alice)).toNumber(), aliceAmount + 6*decimals);
			assert.equal((await instance.balanceOf(bob)).toNumber(), bobAmount + 4*decimals);
		});

		it("should have enough funds to transfer between accounts", async () => {
			let instance = await BrunoShare.deployed();
			const decimals = Math.pow(10, ((await instance.decimals.call()).toNumber()));

			const alice = accounts[6];
			const bob = accounts[1];

			await instance.buy({ from: alice, value: 1000000000000000000 });

			await catchRevert( instance.transfer(bob, 4*decimals, { from: alice }));
		});

		it("should emit event when transfer founds", async () => {
			let instance = await BrunoShare.deployed();
			const decimals = Math.pow(10, ((await instance.decimals.call()).toNumber()));

			const alice = accounts[4];
			const bob = accounts[5];

			await instance.buy({ from: alice, value: 10000000000000000000});

			const receipt = await instance.transfer(bob, 4*decimals, { from: alice });


			assert.equal(receipt.logs[0].args._from, alice);
			assert.equal(receipt.logs[0].args._to, bob);
			assert.equal(receipt.logs[0].args._value.toNumber(), 4*decimals);
		});

		// test and implement allowance e transferFrom features later
	});

	describe("when paying profit sharing", async () => {
		it("must pay profit sharing among shareholders", async () => {
			let instance = await BrunoShare.deployed();
			const decimals = Math.pow(10, ((await instance.decimals.call()).toNumber()));

			const alice = accounts[8];
			const bob = accounts[9];

			await instance.buy({ from: alice, value: 1000000000000000000}); // alice = alice + 1
			await instance.buy({ from: bob, value: 2000000000000000000}); // bob = bob + 2

			const aliceTokenAmount = (await instance.balanceOf(alice)).toNumber();
			console.log("Alice Token Amount: " + aliceTokenAmount);
			const bobTokenAmount = (await instance.balanceOf(bob)).toNumber();
			console.log("Bob Token Amount: " + bobTokenAmount);

			const aliceEtherAmount = await web3.utils.fromWei(await web3.eth.getBalance(alice)); // 89.7
			console.log("Alice Ether Amount: " + aliceEtherAmount);
			const bobEtherAmount = await web3.utils.fromWei(await web3.eth.getBalance(bob)); // 85.7
			console.log("Bob Ether Amount: " + bobEtherAmount);

			await instance.payProfit({ from: accounts[0], value: 50000000000000000000}); // vou pagar 0.05 ether para cada ação.

			const aliceEtherExpected = parseFloat(aliceEtherAmount) + (0.05*(aliceTokenAmount/decimals));
			console.log("Alice Ether Expected: " + aliceEtherExpected);
			const bobEtherExpected = parseFloat(bobEtherAmount) + (0.05*(bobTokenAmount/decimals));
			console.log("Bob Ether Expected: " + bobEtherExpected);

			const aliceEtherFinal = await web3.utils.fromWei(await web3.eth.getBalance(alice));
			console.log("Alice Ether Final: " + aliceEtherFinal);
			const bobEtherFinal = await web3.utils.fromWei(await web3.eth.getBalance(bob));
			console.log("Bob Ether Final: " + bobEtherFinal);

			console.log("Alice Ether Final:", aliceEtherFinal, "Alice Ether Expected:", aliceEtherExpected);
			assert.equal(parseFloat(aliceEtherFinal), aliceEtherExpected);
			console.log("Bob Ether Final:", bobEtherFinal, "Bob Ether Expected:", bobEtherExpected);
			assert.equal(parseFloat(bobEtherFinal), bobEtherExpected);
		});
	});

});